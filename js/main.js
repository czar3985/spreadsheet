/*
 *
 * PAGE SETUP
 *
 *
*/

/* ISSUE: numCols can only go up to 702 */
const numRows = 100;
const numCols = 100;

/* Add column headers */
/* ISSUE: Only goes up to ZZ */
var code1 = 0;
var code2 = 65;
var i, node;
/* Use a fragment to avoid numerous reflows */
const letfragment = document.createDocumentFragment();
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
    $(letfragment).append(node);
}
$('.column-header-row').append(letfragment);

/* Add row numbers */
const numfragment = document.createDocumentFragment();
for (i = 1; i <= numRows; i++) {
    node = $('<tr><td class="row-width">' + i.toString() + '</td></tr>');
    $(numfragment).append(node);
}
$('.row-numbers').append(numfragment);

/* Add cells */
for (var row = 1; row <= numRows; row++) {
    for (var col = 1; col <= numCols; col++) {

    }
}

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