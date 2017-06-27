console.info('Sanity Helper V0.1');

// Initializations
var checkedAssetStringAttributes = [];
var cartParts = [];
var excludedAttributes = ['bm_cm_model_id', 'quoteName_AP', 'quoteNumber_AP', 'contractStartDate_AP', 'contractDuration_AP', 'operationType_AP', 'operatingUnit_AP', 'contractEndDate_AP', 'contractCurrency_AP', 'dataCenterRegion_AP'];
var cartTable = document.getElementById('mandatory-parts');
var activeAttributes = document.querySelectorAll("input[type='text'],input[type='checkbox'],select");

// Grab the assetString (might have different names depending on model)
var configAssetString = document.querySelector("[name='configAssetString_ERP']");
var minimumQuantityString = document.querySelector("[name='minimumQuantityString_PF']");
var assetString = (configAssetString ? configAssetString.value : "") + (minimumQuantityString ? minimumQuantityString.value : "");

////////////////
// Prototypes //
////////////////
var SanityEl = function(type, attrs) {
	var self = this;
	self.el = document.createElement(type);
	document.body.appendChild(self.el);
	if (attrs instanceof Object) {
		Object.keys(attrs).forEach(function(key) {
			self.el.setAttribute(key, attrs[key]);
		})
	}

	self.setText = function(text) {
		var textEl = document.createTextNode(text);
		self.el.appendChild(textEl);
	};
};


// UI Elements
var sanityToolbar = new SanityEl('ul', { class: 'sanity-toolbar'});


// Construct the cartParts array if a cart is available
if (cartTable) {
	var cartRows = cartTable.querySelectorAll('tbody tr.adv-grid-row');
	cartParts = Array.from(cartRows).map(function (row) {
		return {
			part_td: row.querySelector('td.part_number'),
			part_number: row.querySelector('td.part_number').textContent,
			quantity: row.querySelector('td.Quantity').textContent,
			description: row.querySelector('td.description').textContent
		}
	});

	var cartHeading = document.getElementById('mandatory-parts-wrapper').querySelector('.grouping-heading');
	var btnCopyCart = new SanityEl('button', { class: 'btn-copy-cart'});
	btnCopyCart.setText('Copy Cart to Clipboard');
	btnCopyCart.el.addEventListener("click", function (e) {
		e.stopPropagation();
		e.preventDefault();
		copyTextToClipboard(
			cartParts.map(function(part) {
				return [part.part_number, part.description, part.quantity].join('\t');
			}).join('\n')
		);
	});
	cartHeading.appendChild(btnCopyCart.el);
}

if (assetString) {
	// Loop over assetString parts to check against cartParts
	var assetStringArr = assetString.split("@@")
		.filter(function (p) { return p.length; })
		.map(function (p) { return p.split('##'); });

	assetStringArr.forEach(function (p) {
		var node = document.querySelector(".attribute-field-container [name='" + p[1] + "']");
		var isChecked = checkedAssetStringAttributes.indexOf(p[0]) >= 0;
		if (node && !isChecked) {
			var parent = node.parentNode;

			var readOnlyHasValue = (node.type == "hidden" && node.value && node.value != "0");
			var textboxHasValue = (node.type == "text" && node.value && node.value != "0");
			var checkboxIsChecked = (node.type == "checkbox" && node.checked);
			var singleSelectIsSelected = (node.type == "select-one" && node.value != "" && node.value != "No");

			if (readOnlyHasValue || textboxHasValue || checkboxIsChecked || singleSelectIsSelected) {
				var partInCart = cartParts.some(function (part) { return p[0] == part.part_number; });
				var inputMeta = new SanityEl('span', { class: partInCart ? 'green' : 'red' });
				inputMeta.setText(" " + p[0] + " (" + p[2] + ")");
				parent.appendChild(inputMeta.el);
				checkedAssetStringAttributes.push(p[0]);
			}
		}
	});

	// Loop over cartParts to check against checkedAssetStringAttributes parts
	cartParts.forEach(function (p) {
		if (checkedAssetStringAttributes.indexOf(p.part_number) >= 0) {
			p.part_td.classList.add("green");
		} else {
			p.part_td.classList.add("red");
			console.warn(p.part_number + " is in cart but the attribute has no value");
		}
	});

	// Loop over activeAttributes to check against assetString parts
	Array.from(activeAttributes).map( function (a) {
		var existsInAssetString = checkedAssetStringAttributes.some(function (p) { return p[1] == a.name; });
		var isExcluded = excludedAttributes.indexOf(a.name) >= 0;
		if (!(existsInAssetString || isExcluded)) {
			// console.log("%c Note: " + a.name + " is not in assetString", "color: #AA9900");
		}
	});
}

function copyTextToClipboard(text) {
	var textArea = document.createElement("textarea");

	//
	// *** This styling is an extra step which is likely not required. ***
	//
	// Why is it here? To ensure:
	// 1. the element is able to have focus and selection.
	// 2. if element was to flash render it has minimal visual impact.
	// 3. less flakyness with selection and copying which **might** occur if
	//    the textarea element is not visible.
	//
	// The likelihood is the element won't even render, not even a flash,
	// so some of these are just precautions. However in IE the element
	// is visible whilst the popup box asking the user for permission for
	// the web page to copy to the clipboard.
	//

	// Place in top-left corner of screen regardless of scroll position.
	textArea.style.position = 'fixed';
	textArea.style.top = 0;
	textArea.style.left = 0;

	// Ensure it has a small width and height. Setting to 1px / 1em
	// doesn't work as this gives a negative w/h on some browsers.
	textArea.style.width = '2em';
	textArea.style.height = '2em';

	// We don't need padding, reducing the size if it does flash render.
	textArea.style.padding = 0;

	// Clean up any borders.
	textArea.style.border = 'none';
	textArea.style.outline = 'none';
	textArea.style.boxShadow = 'none';

	// Avoid flash of white box if rendered for any reason.
	textArea.style.background = 'transparent';


	textArea.value = text;

	document.body.appendChild(textArea);

	textArea.select();

	try {
		var successful = document.execCommand('copy');
		var msg = successful ? 'successful' : 'unsuccessful';
	} catch (err) {
		console.error('Oops, unable to copy');
	}

	document.body.removeChild(textArea);
}
