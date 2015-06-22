/*
 Author: Daniel Upshaw
 URL: http://danieluphaw.com/
 */

;(function ($, window, document, undefined) {
	"use strict";

	var defaults = {
		css: { // Use {} to bypass adding CSS classes to the container via the plugin (you can use your own CSS files)
			'color': '#E7711B',
			'text-shadow': '-1px 1px 0 rgba(127, 127, 127, 0.4)'
		},
		container: $('<span>').addClass('star-rating'), // By default, the rating container has class "star-rating"
		star: $('<i>').addClass('fa fa-star'),
		star_half: $('<i>').addClass('fa fa-star-half'),
		star_blank: $('<i>').addClass('fa fa-star-o'),
		star_half_blank: $('<i>').addClass('fa fa-star-half-o'),
		/*
		click: function(rating, event) { // Add some functionality for when a star is clicked
			var item_id = this.element.closest('.item').attr('id');
			var $plugin = this;
			$.post(
				'rate-item.php',
				{
					item: item_id,
					item_rating: rating
				}
			)
			.done(function(data) {
				alert('Your rating was stored: ' + rating);
				$plugin.reload(data.updated_rating);
			})
			.fail(function() {
				alert('Could not store your rating');
			})
			.always(function() {
			});
		},
		*/
		hover: function(rating, event) { // Only applies when a click event is defined
			var lte_rating = this.stars.filter(':lt(' + (rating) + ')');
			var gt_rating = this.stars.filter(':gt(' + (rating - 1) + ')');

			if(event.type == 'mouseenter') {
				this.stars.each(function() {
					$(this).data('class-prev', $(this).attr('class'));
				});

				lte_rating.attr('class', this.options.star.attr('class'));
				gt_rating.attr('class', this.options.star_blank.attr('class'));
			} else if (event.type == 'mouseleave') {
				this.stars.each(function() {
					$(this).attr('class', $(this).data('class-prev'));
				});
			}
		},
		rating: function() { // Extract the rating from the element
			var text = this.text().trim();
			var matches;

			if (matches = text.match(/^(?:[^\d]+)?([\d.]+)/i)) {
				// Format: 3.5
				// Format: Rated 3.5
				// Format: 3.5/5 stars
				// Format: Rated 3.5 out of 5 stars
				// Format: 3.5/5 star rating
				return matches[1];
			} else if (matches = text.match(/^([*]+)/i)) {
				// Format: *****
				return matches[1].length;
			}

			return 0;
		},
		// max: 5, // You can optionally use an integer for the maximum rating value
		max: function() { // If max is a function, use it to extract the maximum rating value from the element
			var text = this.text().trim();
			var matches;

			if (matches = text.match(/\/(\d+)(?: [\w\s]+)?$/i)) {
				// Format: 3.5/5
				// Format: 3.5/5 stars
				// Format: 3.5/5 star rating
				return matches[1];
			} else if (matches = text.match(/ (?:out )?of (\d+)(?: [\w\s]+)?$/i)) {
				// Format: 3.5 of 5
				// Format: 3.5 out of 5
				// Format: 3.5 out of 5 stars
				// Format: 3.5 out of 5 points earned
				return matches[1];
			}

			return false;
		},
		round: function(rating) { // Specify what to do with fractional ratings
			// Round to the nearest 0.5
			return Math.round(rating * 2) / 2;
		},
		title: function() { // Set the title (hover text) on the container
			return 'Rated ' + this.rating() + (this.max() ? ' out of ' + this.max() : '');
		},
		render: function() { // The logic performed when the star_rating container is ready to render
			this.element
				.hide()
				.attr('aria-hidden', 'true')
				.after(this.star_rating);
		},
		remove: function() { // Called if the star rating needs to be removed/destroyed from the elements
			this.star_rating.remove();
			this.element.attr('aria-hidden', null).show();
		}
	};

	function Plugin(element, options) {
		this.element   = $(element);
		this.options   = $.extend({}, defaults, options);
		this._defaults = defaults;

		this.init();
	}

	$.extend(Plugin.prototype, {
		init: function () {
			return this._render();
		},
		_render: function() {
			var rounded_rating = this.options.round.call(this, this.rating());
			var whole_stars = Math.floor(rounded_rating);
			// If the fraction after rounding is at least 0.5, add a half star
			var half_star = (rounded_rating - whole_stars >= 0.5) ? 1 : 0;

			this.star_rating = this.options.container
				.clone(false)
				.css(this.options.css)
				.attr('aria-label', this.options.title.call(this))
				.attr('title', this.options.title.call(this));

			this.stars = $();

			for (var i = 0; i < whole_stars; i++) {
				this.stars = this.stars.add(this.options.star.clone(false));
			}

			if (half_star) {
				this.stars = this.stars.add(
					this.max ?
						this.options.star_half_blank.clone(false) :
						this.options.star_half.clone(false)
				);
			}

			if (this.max()) {
				for (var i = whole_stars + half_star; i < this.max(); i++) {
					this.stars = this.stars.add(this.options.star_blank.clone(false));
				}
			}

			this.star_rating.append(this.stars);

			var $plugin = this;

			// Don't bother with click or hover if we don't have a function for clicking
			if ($.isFunction(this.options.click)) {
				this.star_rating.css({'cursor': 'pointer'});

				this.stars.hover(function (e) {
					$plugin.options.hover.call($plugin, $(this).index() + 1, e);
				});

				this.stars.on('click', function (e) {
					$plugin.options.click.call($plugin, $(this).index() + 1, e);
				});
			}

			this.options.render.call(this);

			return this;
		},
		// Get or update the rating
		rating: function(rating) {
			if (typeof rating === 'undefined') {
				// If we haven't initialized the rating yet at all
				if (typeof this._rating === 'undefined') {
					this._rating = this.options.rating.call(this.element);
				}

				return this._rating;
			} else {
				this._rating = rating;
				return this.reload();
			}
		},
		// Get or update the max
		max: function(max) {
			if (typeof max === 'undefined') {
				// If we haven't initialized the max yet at all
				if (typeof this._max === 'undefined') {
					this._max = $.isFunction(this.options.max) ? this.options.max.call(this.element) : this.options.max;
				}

				return this._max;
			} else {
				this._max = max;
				return this.reload();
			}
		},
		reload: function() {
			this.remove();
			return this._render();
		},
		remove: function() {
			this.options.remove.call(this);
			return this;
		},
		// Also removes plugin reference from this.element
		// Additional functionality below
		destroy: function() {
			this.remove();

			return this.element;
		}
	});

	var plugin_name = 'star_rating';

	$.fn[plugin_name] = function(options) {
		var args = arguments;

		if (!(this instanceof $)) {
			return $.extend(defaults, options);
		}

		if (options === undefined || typeof options === 'object') {
			return this.each(function () {
				if (!$.data(this, 'plugin_' + plugin_name)) {
					$.data(this, 'plugin_' + plugin_name, new Plugin(this, options));
				}
			});
		} else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
			var applied;

			this.each(function() {
				var instance = $.data(this, 'plugin_' + plugin_name);

				if (instance instanceof Plugin && $.isFunction(instance[options])) {
					applied = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
				}

				if (options === 'destroy') {
					$.data(this, 'plugin_' + plugin_name, null);
				}
			});

			return applied !== undefined ? applied : this;
		}
	};

}(jQuery, window, document));
