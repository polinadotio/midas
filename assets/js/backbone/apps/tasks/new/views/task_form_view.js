define([
    'jquery',
    'bootstrap',
    'underscore',
    'backbone',
    'async',
    'utilities',
    'tasks_collection',
    'text!task_form_template'
], function ($, Bootstrap, _, Backbone, async, utilities, TasksCollection, TaskFormTemplate) {

  var TaskFormView = Backbone.View.extend({

    el: "#task-list-wrapper",

    events: {
      "blur .validate"        : "v",
      "change #task-location" : "locationChange"
    },

    initialize: function () {
      this.options = _.extend(this.options, this.defaults);
      this.tasks = this.options.tasks;
      this.initializeSelect2Data();
      this.initializeListeners();
    },

    initializeSelect2Data: function () {
      var self = this;
      var types = ["task-skills-required", "task-time-required", "task-people", "task-length", "task-time-estimate"];

      this.tagSources = {};

      var requestAllTagsByType = function (type) {
        $.ajax({
          url: '/api/ac/tag?type=' + type + '&list',
          type: 'GET',
          async: false,
          success: function (data) {
            self.tagSources[type] = data;
          }
        });
      }

      async.each(types, requestAllTagsByType, function (err) {
        self.render();
      });
    },

    initializeListeners: function() {
      var self = this;

      this.listenTo(this.tasks, "task:save:success", function (taskId) {

        var addTag = function (tag, done) {
          if (!tag || !tag.id) return done();
          // if (tag.tagId) return done();

          var tagMap = {
            taskId: taskId,
            tagId: tag.id
          }

          $.ajax({
            url: '/api/tag',
            type: 'POST',
            data: tagMap,
            success: function (data) {
              done();
            },
            error: function (err) {
              done(err);
            }
          });
        };

        // Gather tags for submission after the task is created
        tags = [];
        tags.push.apply(tags, $("#topics").select2('data'));
        tags.push.apply(tags, $("#skills").select2('data'));
        tags.push($("#skills-required").select2('data'));
        tags.push($("#people").select2('data'));
        tags.push($("#time-required").select2('data'));
        tags.push($("#time-estimate").select2('data'));
        tags.push($("#length").select2('data'));

        if (self.$("#task-location").select2('data').id == 'true') {
          tags.push.apply(tags, self.$("#location").select2('data'));
        }

        async.each(tags, addTag, function (err) {
          self.model.trigger("task:modal:hide");
          return self.model.trigger("task:tags:save:success", err);
        });

      });
    },

    render: function () {
      var template = _.template(TaskFormTemplate, { tags: this.tagSources })
      this.$el.html(template);
      this.initializeSelect2();

      // Important: Hide all non-currently opened sections of wizard.
      // TODO: Move this to the modalWizard js.
      $("section:not(.current)").hide();

      // Return this for chaining.
      return this;
    },

    v: function (e) {
      return validate(e);
    },

    childNext: function (e, current) {
      // find all the validation elements
      var children = current.find('.validate');
      var abort = false;
      _.each(children, function (child) {
        var iAbort = validate({ currentTarget: child });
        abort = abort || iAbort;
      });
      return abort;
    },

    initializeSelect2: function () {
      var self = this;

      var formatResult = function (obj, container, query) {
        return obj.name;
      };

      // ------------------------------ //
      //  DROP DOWNS REQUIRING A FETCH  //
      // ------------------------------ //
      $("#skills").select2({
        placeholder: "Start typing to select a skill.",
        multiple: true,
        formatResult: formatResult,
        formatSelection: formatResult,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'skill',
              q: term
            };
          },
          results: function (data) {
            return { results: data }
          }
        }
      });

      // Topics select 2
      $("#topics").select2({
        placeholder: "Start typing to select a topic.",
        multiple: true,
        formatResult: formatResult,
        formatSelection: formatResult,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'topic',
              q: term
            };
          },
          results: function (data) {
            return { results: data }
          }
        }
      });

      // Topics select 2
      this.$("#location").select2({
        placeholder: "Start typing to select a location.",
        multiple: true,
        formatResult: formatResult,
        formatSelection: formatResult,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'location',
              q: term
            };
          },
          results: function (data) {
            return { results: data }
          }
        }
      });
      this.$(".el-specific-location").hide();

      // ------------------------------ //
      // PRE-DEFINED SELECT MENUS BELOW //
      // ------------------------------ //
      $("#skills-required").select2({
        placeholder: "Required/Not Required",
        width: 'resolve'
      });

      $("#time-required").select2({
        placeholder: 'Time Commitment',
        width: 'resolve'
      });

      $("#people").select2({
        placeholder: 'Personnel Needed',
        width: 'resolve'
      });

      $("#length").select2({
        placeholder: 'Deadline',
        width: 'resolve'
      });

      $("#time-estimate").select2({
        placeholder: 'Estimated Time Required',
        width: 'resolve'
      });

      $("#task-location").select2({
        placeholder: 'Work Location',
        width: 'resolve'
      });

    },

    locationChange: function (e) {
      if (_.isEqual(e.currentTarget.value, "true")) {
        $(".el-specific-location").show();
      } else {
        $(".el-specific-location").hide();
      }
    },

    cleanup: function () {
      removeView(this);
    }

  });

  return TaskFormView;

});
