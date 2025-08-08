const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  favourites: [String],
  history: [String],
});

module.exports = class UsersDB {
  constructor() {
    this.User = null;
    this.db = null;
  }

  connect(connectionString = process.env.MONGO_URL) {
    return new Promise((resolve, reject) => {
      this.db = mongoose.createConnection(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.db.on("error", (err) => reject(err));

      this.db.once("open", () => {
        this.User = this.db.model("User", userSchema);
        resolve();
      });
    });
  }

  registerUser(userData) {
    return new Promise((resolve, reject) => {
      if (!this.User) return reject("Database not connected");

      if (userData.password !== userData.password2) {
        return reject("Passwords do not match");
      }

      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          const newUser = new this.User({
            userName: userData.userName,
            password: hash,
            favourites: [],
            history: [],
          });

          return newUser.save();
        })
        .then(() =>
          resolve(`User ${userData.userName} successfully registered`)
        )
        .catch((err) => {
          if (err.code === 11000) {
            reject("User Name already taken");
          } else {
            reject("There was an error creating the user: " + err.message);
          }
        });
    });
  }

  checkUser(userData) {
    return new Promise((resolve, reject) => {
      if (!this.User) return reject("Database not connected");

      this.User.findOne({ userName: userData.userName })
        .then((user) => {
          if (!user) return reject("Unable to find user " + userData.userName);

          bcrypt.compare(userData.password, user.password).then((match) => {
            if (match) resolve(user);
            else reject("Incorrect password for user " + userData.userName);
          });
        })
        .catch(() => {
          reject("Unable to find user " + userData.userName);
        });
    });
  }

  getFavourites(id) {
    return this.User.findById(id)
      .then((user) => user.favourites)
      .catch(() =>
        Promise.reject(`Unable to get favourites for user with id: ${id}`)
      );
  }

  addFavourite(id, favId) {
    return this.User.findById(id)
      .then((user) => {
        if (user.favourites.length >= 50) throw new Error();
        return this.User.findByIdAndUpdate(
          id,
          { $addToSet: { favourites: favId } },
          { new: true }
        );
      })
      .then((user) => user.favourites)
      .catch(() =>
        Promise.reject(`Unable to update favourites for user with id: ${id}`)
      );
  }

  removeFavourite(id, favId) {
    return this.User.findByIdAndUpdate(
      id,
      { $pull: { favourites: favId } },
      { new: true }
    )
      .then((user) => user.favourites)
      .catch(() =>
        Promise.reject(`Unable to update favourites for user with id: ${id}`)
      );
  }

  getHistory(id) {
    return this.User.findById(id)
      .then((user) => user.history)
      .catch(() =>
        Promise.reject(`Unable to get history for user with id: ${id}`)
      );
  }

  addHistory(id, historyId) {
    return this.User.findById(id)
      .then((user) => {
        if (user.history.length >= 50) throw new Error();
        return this.User.findByIdAndUpdate(
          id,
          { $addToSet: { history: historyId } },
          { new: true }
        );
      })
      .then((user) => user.history)
      .catch(() =>
        Promise.reject(`Unable to update history for user with id: ${id}`)
      );
  }

  removeHistory(id, historyId) {
    return this.User.findByIdAndUpdate(
      id,
      { $pull: { history: historyId } },
      { new: true }
    )
      .then((user) => user.history)
      .catch(() =>
        Promise.reject(`Unable to update history for user with id: ${id}`)
      );
  }
};
