'use strict';

const htmlToText = require('html-to-text');

function getMentionedContent(content, userId) {
    return htmlToText.fromString(content).trim();
  }

module.exports = {
  getMentionedContent
}