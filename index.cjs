const Application = require('@waline/vercel');
const beian = require('./beian/index.cjs');

module.exports = Application({
  plugins: [beian],
  async postSave(comment) {
    // do what ever you want after comment saved
  },
});
