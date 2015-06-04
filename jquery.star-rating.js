/*
 Author: Daniel Upshaw
 URL: http://danieluphaw.com/
 */

;(function ($, window, document, undefined) {
	"use strict";

	var defaults = {
		css: {
			'color': 'gold',
			'text-shadow': '-1px 1px 0 rgba(127, 127, 127, 0.6)'
		},
		container: $('<span>').addClass('star-rating'),
		star: $('<i>').addClass('fa fa-star'),
		star_blank: $('<i>').addClass('fa fa-star-half'),
		star_empty: $('<i>').addClass('fa fa-star-o'),
		star_half_blank: $('<i>').addClass('fa fa-star-half-o'),
		click: function(rating) {

		},
		// max: 5,
		max: function() {
			var text = this.text().trim();
			var matches;

			// Format: 3.5/5
			// Format: 3.5/5 stars
			// Format: 3.5/5 star rating
			if (matches = text.match(/\/(\d+)(?: [\w\s]+)?$/i)) {
				return matches[1];
			// Format: 3.5 of 5
			// Format: 3.5 out of 5
			// Format: 3.5 out of 5 stars
			// Format: 3.5 out of 5 points earned
			} else if (matches = text.match(/ (?:out )?of (\d+)(?: [\w\s]+)?$/i)) {
				return matches[1];
			}

			return false;
		},
		rating: function() {
			var text = this.text().trim();
			var matches;

			if (matches = text.match(/^([\d.]+)/i)) {
				return matches[1];
			} else if (matches = text.match(/^([*]+)/i)) {
				return matches[1].length;
			}

			return 0;
		},
		round: function(rating) {
			// Round to the nearest 0.5
			return Math.round(rating * 2) / 2;
		},
		title: function() {
			return this.rating + (this.max ? ' out of ' + this.max : '');
		},
		render: function() {
			this.element.hide().after(this.star_rating);
		},
		destroy: function() {
			this.star_rating.remove();
			this.element.show();
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
			this.rating = this.options.rating.call(this.element);
			this.max = $.isFunction(this.options.max) ? this.options.max.call(this.element) : this.options.max;

			this._render();

			return this;
		},
		_render: function() {
			var rounded_rating = this.options.round.call(this, this.rating);
			var whole_stars = Math.floor(rounded_rating);
			// If the fraction after rounding is at least 0.5, add a half star
			var half_star = (rounded_rating - whole_stars >= 0.5) ? 1 : 0;

			this.star_rating = this.options.container
				.clone(false)
			    .css(this.options.css)
			    .attr('title', this.options.title.call(this));

			for (var i = 0; i < whole_stars; i++) {
				this.star_rating.append(this.options.star.clone(false));
			}

			if (half_star) {
				this.star_rating.append(
					this.max ?
						this.options.star_half_blank.clone(false) :
						this.options.star_blank.clone(false)
				);
			}

			if (this.max) {
				for (var i = whole_stars + half_star; i < this.max; i++) {
					this.star_rating.append(this.options.star_empty.clone(false));
				}
			}

			this.options.render.call(this);

			return this;
		},
		// Also removes plugin reference from this.element
		// Additional functionality below
		destroy: function() {
			this.options.destroy.call(this);
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
			var returns;

			this.each(function() {
				var instance = $.data(this, 'plugin_' + plugin_name);

				if (instance instanceof Plugin && typeof instance[options] === 'function') {
					returns = instance[options].apply( instance, Array.prototype.slice.call(args, 1));
				}

				if (options === 'destroy') {
					$.data(this, 'plugin_' + plugin_name, null);
				}
			});

			return returns !== undefined ? returns : this;
		}
	};

}(jQuery, window, document));