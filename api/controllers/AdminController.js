/**
 * AdminController
 *
 * @module      :: Controller
 * @description	:: Administrative functions only available to admin users
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {

  /**
   * List users that match a certain filter, or all users if no filter
   * @param page the current page number
   * @param limit the maximum number of results per page to return
   * @param q the filter to apply to the search (filters by name)
   */
  users: function (req, res) {
    var page = parseInt(req.param('page', 1));
    var limit = req.param('limit', 25);
    var query = req.param('q');
    var where = {};

    if (query) {
      // just query name for now
      where = {
        like: {
          name: query
        }
      };
      // There's a bug in waterline that prevents nested OR
      // from expanding.  See:
      // https://github.com/balderdashy/waterline/issues/116
      // and
      // https://github.com/balderdashy/sails-postgresql/issues/24
      // where = {
      //   or: [
      //     { like: { name: query }},
      //     { like: { username: query }}
      //   ]
      // };
    }

    // find users that meet this criteria
    User.find()
    .where(where)
    .sort('id')
    .paginate({ page: page, limit: limit})
    .exec(function (err, users) {
      if (err) { return res.send(400, { message: 'Error looking up users', err: err}); }
      // count the total number of users
      User.count(function (err, count) {
        if (err) { return res.send(400, { message: 'Error counting users', err: err}); }
        // return a paginated object
        return res.send({
          page: page,
          limit: Math.min(users.length, limit),
          count: count,
          users: users,
          q: query
        });
      })
    });
  },

  /**
   * Add or remove admin priviledges from a user account
   * @param id the user id to make an admin or remove
   * @param action true to make admin, false to revoke
   * eg: /api/admin/admin/:id?action=true
   */
  admin: function (req, res) {
    if (!req.route.params.id) {
      return res.send(400, { message: 'Must specify a user id for this action.' });
    }
    User.findOneById(req.route.params.id, function (err, user) {
      if (err) { return res.send(400, { message: 'An error occurred looking up this user.', error: err }); }
      user.isAdmin = (req.param('action') === 'true');
      user.save(function (err) {
        if (err) { return res.send(400, { message: 'An error occurred changing admin status for this user.', error: err }); }
        return res.send(user);
      });
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to AdminController)
   */
  _config: {}

};
