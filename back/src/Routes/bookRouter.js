const express = require('express');
const bookRouter = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');
const {
  uploadBook,
  getBooksList,
  getBookStatus,
  reindexBook,
  deleteBook,
} = require('../controllers/bookController');

bookRouter.post('/upload', adminMiddleware, uploadBook);
bookRouter.get('/list', userMiddleware, getBooksList);
bookRouter.get('/status/:id', adminMiddleware, getBookStatus);
bookRouter.post('/reindex/:id', adminMiddleware, reindexBook);
bookRouter.delete('/delete/:id', adminMiddleware, deleteBook);

module.exports = bookRouter;
