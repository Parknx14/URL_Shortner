// // =============================================================
// // config/database.js
// // =============================================================
// // This simulates a MongoDB database using plain JSON files.
// //
// // WHY JSON FILES INSTEAD OF REAL MONGODB?
// //   Real MongoDB requires installing a database server, creating
// //   a cluster, setting up connection strings, etc. For learning
// //   the CODE STRUCTURE, JSON files work identically — you can
// //   swap this out for real MongoDB later with minimal changes.
// //
// // HOW IT WORKS:
// //   Each "collection" (users, urls, clicks) is stored as a
// //   JSON file in the /data folder:
// //     data/users.json   → [{id, email, password, ...}, ...]
// //     data/urls.json    → [{id, shortCode, longUrl, ...}, ...]
// //     data/clicks.json  → [{id, urlId, country, ...}, ...]
// //
// // REAL MONGODB EQUIVALENT:
// //   This file would instead contain:
// //     const mongoose = require('mongoose')
// //     mongoose.connect('mongodb://localhost:27017/snaplink')
// // =============================================================

// const fs   = require('fs');    // fs = File System, built into Node.js
// const path = require('path');  // path = handles file paths across OS
// const { DATA_DIR } = require('./index');

// // Make sure the /data folder exists when the server starts
// if (!fs.existsSync(DATA_DIR)) {
//   fs.mkdirSync(DATA_DIR, { recursive: true });
// }

// /**
//  * getFilePath(collection)
//  * Returns the file path for a collection.
//  * e.g., getFilePath('users') → './data/users.json'
//  *
//  * path.join() safely combines path segments (handles / vs \ on Windows)
//  */
// function getFilePath(collection) {
//   return path.join(DATA_DIR, `${collection}.json`);
// }

// /**
//  * readCollection(collection)
//  * Reads all documents from a JSON file.
//  * Like: db.collection.find({}) in MongoDB
//  *
//  * fs.existsSync() — checks if file exists (returns true/false)
//  * fs.readFileSync() — reads file contents as a string
//  * JSON.parse() — converts JSON string to JavaScript array/object
//  */
// function readCollection(collection) {
//   const filePath = getFilePath(collection);
//   if (!fs.existsSync(filePath)) return []; // File doesn't exist yet → empty array
//   const raw = fs.readFileSync(filePath, 'utf8');
//   return JSON.parse(raw);
// }

// /**
//  * writeCollection(collection, data)
//  * Saves all documents back to the JSON file.
//  * Like: overwriting the entire collection (not ideal for scale,
//  * but fine for learning — MongoDB handles this atomically)
//  *
//  * JSON.stringify(data, null, 2) → converts JS array to formatted JSON
//  *   null = no replacer function
//  *   2 = 2-space indentation (makes the file human-readable)
//  */
// function writeCollection(collection, data) {
//   const filePath = getFilePath(collection);
//   fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
// }

// // =============================================================
// // DB OBJECT: The public API of our database layer.
// // These methods mirror MongoDB's driver API so the switch
// // to real MongoDB later is straightforward.
// // =============================================================
// const DB = {

//   /**
//    * findAll(collection)
//    * MongoDB equivalent: collection.find({})
//    * Returns every document in the collection.
//    */
//   findAll(collection) {
//     return readCollection(collection);
//   },

//   /**
//    * findOne(collection, predicate)
//    * MongoDB equivalent: collection.findOne({ field: value })
//    * Returns first document where predicate(doc) === true
//    *
//    * @param {Function} predicate - filter function
//    * Example: DB.findOne('users', u => u.email === 'a@b.com')
//    */
//   findOne(collection, predicate) {
//     const all = readCollection(collection);
//     return all.find(predicate) || null;
//   },

//   /**
//    * find(collection, predicate)
//    * MongoDB equivalent: collection.find({ field: value })
//    * Returns ALL documents matching the predicate.
//    */
//   find(collection, predicate) {
//     const all = readCollection(collection);
//     return predicate ? all.filter(predicate) : all;
//   },

//   /**
//    * insertOne(collection, doc)
//    * MongoDB equivalent: collection.insertOne(doc)
//    * Adds one document to the collection.
//    * Returns the inserted document.
//    */
//   insertOne(collection, doc) {
//     const all = readCollection(collection);
//     all.push(doc);
//     writeCollection(collection, all);
//     return doc;
//   },

//   /**
//    * updateOne(collection, id, updates)
//    * MongoDB equivalent: collection.updateOne({ _id: id }, { $set: updates })
//    * Merges `updates` into the document with matching id.
//    *
//    * The spread operator {...existing, ...updates} merges objects:
//    *   existing = { id: '1', name: 'Alice', age: 25 }
//    *   updates  = { age: 26 }
//    *   result   = { id: '1', name: 'Alice', age: 26 }
//    */
//   updateOne(collection, id, updates) {
//     const all = readCollection(collection);
//     const idx = all.findIndex(d => d.id === id);
//     if (idx === -1) return null;
//     all[idx] = { ...all[idx], ...updates, updatedAt: Date.now() };
//     writeCollection(collection, all);
//     return all[idx];
//   },

//   /**
//    * deleteOne(collection, id)
//    * MongoDB equivalent: collection.deleteOne({ _id: id })
//    * Removes the document with the given id.
//    */
//   deleteOne(collection, id) {
//     const all = readCollection(collection);
//     const filtered = all.filter(d => d.id !== id);
//     writeCollection(collection, filtered);
//     return filtered.length < all.length; // true if something was deleted
//   },

//   /**
//    * count(collection, predicate)
//    * MongoDB equivalent: collection.countDocuments({ field: value })
//    */
//   count(collection, predicate) {
//     return this.find(collection, predicate).length;
//   }
// };

// module.exports = DB;



// ------new update----



// =============================================================
// config/database.js
// =============================================================
// Real MongoDB connection using Mongoose.
//
// MONGOOSE:
//   Mongoose is a library that makes MongoDB easier to use.
//   It lets you define "schemas" (shape of your data) and
//   gives you simple methods like .find() .save() .delete()
//
// SCHEMA:
//   A schema defines what fields a document has.
//   Like a blueprint for your data.
//   e.g., every User must have email, password, name
// =============================================================

const mongoose = require('mongoose');
const { MONGODB_URI } = require('./index');

// =============================================================
// CONNECT TO MONGODB
// =============================================================
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Exit the process if database connection fails
    // No point running the server without a database
    process.exit(1);
  }
}

// =============================================================
// USER SCHEMA
// Defines the shape of a user document in MongoDB.
// =============================================================
const userSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  name:      { type: String, required: true },
  plan:      { type: String, default: 'free' },
  createdAt: { type: Number, default: Date.now },
});

// =============================================================
// URL SCHEMA
// =============================================================
const urlSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  longUrl:   { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  title:     { type: String },
  clicks:    { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  expiresAt: { type: Number, default: null },
  createdAt: { type: Number, default: Date.now },
});

// TTL INDEX — MongoDB automatically deletes expired URLs!
// This is the real MongoDB TTL index from the resume bullet point.
// It checks every 60 seconds and deletes docs where expiresAt < now
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// =============================================================
// CLICK SCHEMA
// =============================================================
const clickSchema = new mongoose.Schema({
  urlId:     { type: String, required: true },
  shortCode: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
  country:   { type: String },
  device:    { type: String },
  referrer:  { type: String },
});

// =============================================================
// COUNTER SCHEMA (for Base62 auto-increment)
// =============================================================
const counterSchema = new mongoose.Schema({
  id:    { type: String, required: true, unique: true },
  value: { type: Number, required: true },
});

// =============================================================
// MODELS
// A model is what you use to actually query the database.
// mongoose.model('User', userSchema) creates a User model
// that maps to the 'users' collection in MongoDB.
// =============================================================
const User    = mongoose.model('User',    userSchema);
const Url     = mongoose.model('Url',     urlSchema);
const Click   = mongoose.model('Click',   clickSchema);
const Counter = mongoose.model('Counter', counterSchema);

module.exports = { connectDB, User, Url, Click, Counter };