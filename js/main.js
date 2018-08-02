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
function addTheCells() {
    $('.worksheet').append('<table class="cells"></table>');
    var fragment = document.createDocumentFragment();
    var i = 1;
    for (var row = 1; row <= numRows; row++) {

        var newRow = document.createElement('tr');

        for (var col = 1; col <= numCols; col++) {
            $(newRow).append('<td><input type="text" data-index="' + i.toString() + '"></td>');
            i++;
        }
        $(fragment).append(newRow);
    }
    $('.cells').append(fragment);
}
addTheCells();

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
$(".worksheet").on("keydown", 'tr', function (e) {

    if ((e.key === 'b') && (e.ctrlKey === true))
        $(e.target).toggleClass('bold');

    else if ((e.key === 'i') && (e.ctrlKey === true))
        $(e.target).toggleClass('italic');

    else if ((e.key === 'u') && (e.ctrlKey === true))
        $(e.target).toggleClass('underline');
});

function parseFormula(input) {
    /* Check if valid formula */
    if (input.charAt(0) !== '=')
        return null;

    input = input.slice(1);/* Remove '=' */
    if (input === '')
        return null

    /* Check for operators */
    if (!(input.includes('*')) &&
        !(input.includes('/')) &&
        !(input.includes('+')) &&
        !(input.includes('-'))) {

        /* Add checking for valid numbers e.g., "= 6 " */
        if (isNaN(input.trim()))
            return null;
        else
            return [input.trim()];
    }

    /* Consider MDAS rule */
    /* TODO: Add parentheses support in formulas */
    var arr = input.split(/([\*\/+-])/);
    if (arr.length === 0)
        return null

    var arrClean = [];
    var isPrevNum = false;
    var isInvalid = false;
    var arrCount = arr.length;

    /* Remove empty array items */
    arr.forEach(function (item) {
        if (item !== "")
            arrClean.push(item);
    });

    arrClean.forEach(function (item, index) {
        /* Trim white spaces around, but white space inside--> NaN */
        arrClean[index] = item.trim();

        if ((arrClean[index] !== '*') &&
            (arrClean[index] !== '/') &&
            (arrClean[index] !== '+') &&
            (arrClean[index] !== '-') &&
            isNaN(arrClean[index])) {
            isInvalid = true;
            return;
        }

        /* Check order of number and operator */
        /* TODO: Support for unary operators + and - */
        if (!isPrevNum) { /* Expect number here */
            if ((arrClean[index] !== '*') &&
                (arrClean[index] !== '/') &&
                (arrClean[index] !== '+') &&
                (arrClean[index] !== '-'))
                isPrevNum = true;
            else {
                isInvalid = true;
                return;
            }
        }
        else { /* Expect operator here */
            if ((arrClean[index] !== '*') &&
                (arrClean[index] !== '/') &&
                (arrClean[index] !== '+') &&
                (arrClean[index] !== '-')) {
                isInvalid = true;
                return;
            }
            else if (index === arrCount - 1) {
                isInvalid = true;
                return;
            }
            else
                isPrevNum = false;
        }
    });
    if (isInvalid)
        return null;

    return arrClean;
}

function multiplyDivide(arr) {
    var arrEq = [];
    var i;
    var justPush = false;

    var found = arr.find(function (element) {
        return (element === '*' || element === '/');
    });
    if (!found)
        return arr;

    for (i = 0; i < arr.length; i++) {
        if ((arr[i + 1] !== '*') && (arr[i + 1] !== '/') && justPush) {
            arrEq.push(arr[i]);
            continue;
        }
        else {
            var num;
            if (arr[i + 1] === '*')
                num = arr[i] * arr[i + 2];
            else
                num = arr[i] / arr[i + 2];
            arrEq.push(num);
            i += 2;
            justPush = true;
        }
    }

    if (arrEq.Length !== 1)
        return multiplyDivide(arrEq);
    else
        return arrEq;
}

function addSubtract(arr) {
    var answer;

    for (var i = 0, answer = Number(arr[i]); i < arr.length -1; i+=2) {
        if (arr[i + 1] === '+') {
            answer = answer + Number(arr[i + 2]);
        }
        else {
            answer = answer - Number(arr[i + 2]);
        }
    }

    return answer;
}

/* Get and save input */
$(".worksheet").on("change", 'input', function (e) {
    /* Empty string value */
    if ($(e.target).val() === '') {
        if ($(e.target).data('index') in dictInput)
            delete dictInput[$(e.target).data('index')];
        return;
    }

    /* Save the string or formula */
    var input = $(e.target).val();
    dictInput[$(e.target).data('index')] = input;

    /* Check the input */
    if (!isNaN(input)) {
        /* Value is a number -> Save */
        /* TODO: Comma-separated numbers are not yet recognized as numbers */
        dictValue[$(e.target).data('index')] = input;
    }
    else {
        var arr = parseFormula(input);
        if (arr == null)
            return;

        var arrMd = multiplyDivide(arr);
        if (arrMd.length === 1)
            value = arrMd[0];
        else
            value = addSubtract(arrMd);

        if (!isNaN(value)) {
            dictValue[$(e.target).data('index')] = value;
            $(e.target).val(value);
        }
    }
});

$(".worksheet").on("focus", 'input', function (e) {
    if ($(e.target).data('index') in dictInput)
        $('.cell-input').val(dictInput[$(this).data('index')]);
    else
        $('.cell-input').val('');

    if (isNaN($(e.target).data('index'))) {
        $('.cell-selected').val('');
        return;
    }

    /* Convert index to column and row number */
    var row = Math.ceil($(e.target).data('index') / numCols);

    var col = $(e.target).data('index') % numCols;
    if (col === 0)
        col = 100;
    var colString = '';

    if (Math.ceil(col / 26) > 1)
        colString += String.fromCharCode(Math.ceil(col / 26) + 63);

    if ((col % 26) === 0)
        colString += String.fromCharCode(90);
    else
        colString += String.fromCharCode((col % 26) + 64);

    $('.cell-selected').val(colString + row.toString());
});

$('.button-refresh').click(function () {
    /* Delete cells */
    $(".cells").detach();

    /* Add the cells */
    addTheCells();

    /* Put data back from the dictionary */
    for (var key in dictInput) {
        var row = Math.ceil(key / numCols);
        var col = (key % 100) === 0 ? 100 : (key % 100);
        var target = $('.cells tr:nth-child('
            + row.toString()
            + ') td:nth-child('
            + col.toString()
            + ') input');

        if (key in dictValue)
            $(target).val(dictValue[key]);
        else
            $(target).val(dictInput[key]);
    }

    alert('Spreadsheet has been refreshed.');
});