#!/bin/sh

uglifycss assets/css/todo-styles.css > assets/css/todo-styles.min.css &&
uglifyjs assets/JS/todo-app.js --compress --mangle -o assets/JS/todo-app.min.js
