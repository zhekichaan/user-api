const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schema and model
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

const User = mongoose.model("users", userSchema);

// Register user
module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      return reject("Passwords do not match");
    }

    bcrypt
      .hash(userData.password, 10)
      .then((hash) => {
        const newUser = new User({
          userName: userData.userName,
          password: hash,
          favourites: [],
          history: [],
        });

        newUser
          .save()
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
      })
      .catch((err) => reject("Error hashing password: " + err.message));
  });
};

// Check login
module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) return reject(`Unable to find user ${userData.userName}`);

        bcrypt.compare(userData.password, user.password).then((result) => {
          if (result === true) resolve(user);
          else reject("Incorrect password for user " + userData.userName);
        });
      })
      .catch(() => {
        reject("Unable to find user " + userData.userName);
      });
  });
};

// Get favourites
module.exports.getFavourites = function (id) {
  return User.findById(id)
    .then((user) => user.favourites)
    .catch(() =>
      Promise.reject(`Unable to get favourites for user with id: ${id}`)
    );
};

// Add to favourites
module.exports.addFavourite = function (id, favId) {
  return User.findById(id)
    .then((user) => {
      if (user.favourites.length >= 50) throw new Error();
      return User.findByIdAndUpdate(
        id,
        { $addToSet: { favourites: favId } },
        { new: true }
      );
    })
    .then((user) => user.favourites)
    .catch(() =>
      Promise.reject(`Unable to update favourites for user with id: ${id}`)
    );
};

// Remove from favourites
module.exports.removeFavourite = function (id, favId) {
  return User.findByIdAndUpdate(
    id,
    { $pull: { favourites: favId } },
    { new: true }
  )
    .then((user) => user.favourites)
    .catch(() =>
      Promise.reject(`Unable to update favourites for user with id: ${id}`)
    );
};

// Get history
module.exports.getHistory = function (id) {
  return User.findById(id)
    .then((user) => user.history)
    .catch(() =>
      Promise.reject(`Unable to get history for user with id: ${id}`)
    );
};

// Add to history
module.exports.addHistory = function (id, historyId) {
  return User.findById(id)
    .then((user) => {
      if (user.history.length >= 50) throw new Error();
      return User.findByIdAndUpdate(
        id,
        { $addToSet: { history: historyId } },
        { new: true }
      );
    })
    .then((user) => user.history)
    .catch(() =>
      Promise.reject(`Unable to update history for user with id: ${id}`)
    );
};

// Remove from history
module.exports.removeHistory = function (id, historyId) {
  return User.findByIdAndUpdate(
    id,
    { $pull: { history: historyId } },
    { new: true }
  )
    .then((user) => user.history)
    .catch(() =>
      Promise.reject(`Unable to update history for user with id: ${id}`)
    );
};
