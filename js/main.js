/*
 *
 * PAGE SETUP
 *
 *
*/

/* Global Objects */
var dictInput = {}; /* User input per cell */
var dictValue = {}; /* Calculated value per cell */

/* ISSUE: numCols can only go up to 702 */
const numRows = 100;
const numCols = 100;

/* Add column headers */
/* ISSUE: Only goes up to ZZ */
var code1 = 0;
var code2 = 65;
var i, node;
/* Use a fragment to avoid numerous reflows */
var fragment = document.createDocumentFragment();
for (i = 1; i <= numCols; i++) {
    if (code1 === 0) { /* Single letter columns */
        node = $('<th>' + String.fromCharCode(code2) + '</th>');
        if (code2 === 90) { /* At Z, move to AA */
            code1 = 65;
            code2 = 65;
        }
        else {
            code2++;
        }
    }
    else { /* Double letter columns */
        node = $('<th>' + String.fromCharCode(code1) + String.fromCharCode(code2) + '</th>');
        if (code2 === 90) { /* e.g. At AZ, move to BA */
            code1++;
            code2 = 65;
        }
        else {
            code2++;
        }
    }
    $(fragment).append(node);
}
$('.column-header-row').append(fragment);

/* Add row numbers */
fragment = document.createDocumentFragment();
for (i = 1; i <= numRows; i++) {
    node = $('<tr><td class="row-width">' + i.toString() + '</td></tr>');
    $(fragment).append(node);
}
$('.row-numbers').append(fragment);

/* Add cells */
fragment = document.createDocumentFragment();
i = 1;
for (var row = 1; row <= numRows; row++) {

    var newRow = document.createElement('tr');

    for (var col = 1; col <= numCols; col++) {
        $(newRow).append('<td><input type="text" data-index="' + i.toString() + '"></td>');
        i++;
    }
    $(fragment).append(newRow);
}
$('.cells').append(fragment);

/*
 *
 * EVENT LISTENERS
 *
 *
*/

/* Allow the column header and row number column to scroll accordingly */
$(window).scroll(function () {
    $('.column-header').css('left', (-window.pageXOffset).toString() + 'px');
    $('.row-number-section').css('top', (112 - window.pageYOffset).toString() + 'px');
});

/* Cell formatting */
$('input').keydown(function (e) {

    if ((e.key == 'b') && (e.ctrlKey == true))
        $(this).toggleClass('bold');

    else if ((e.key == 'i') && (e.ctrlKey == true))
        $(this).toggleClass('italic');

    else if ((e.key == 'u') && (e.ctrlKey == true))
        $(this).toggleClass('underline');
});

/* Get and save input */
$('input').blur(function (e) {
    /* Save input string, number or formula if cell isn't blank after losing focus */
    if ($(this).val() === '')
        return;

    var input = $(this).val();
    dictInput[$(this).data('index')] = input;

    /* Check the input */
    if (!isNaN(input)) {
        /* Value is a number -> Save */
        /* TODO: Comma-separated numbers are not yet recognized as numbers */
        dictValue[$(this).data('index')] = input;
    }
    else {
        /* Check if valid formula */
        if (input.charAt(0) === '=') {
            input = input.slice(1)/*.replace(/\s+/g, '')*/;/* Remove '=' */
            if (input === '')
                return

            /* Check for operators */
            if (!(input.includes('*')) &&
                !(input.includes('/')) &&
                !(input.includes('+')) &&
                !(input.includes('-')))
                return;

            /* Consider MDAS rule */
            var arr = input.split(/\*\//);
            if (arr.length === 0)
                return

            console.log(arr);
        }
    }
});