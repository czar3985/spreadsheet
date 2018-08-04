/*
 *
 * PAGE SETUP
 *
 *
*/

/*
 * GLOBAL VARIABLES FOR SAVING THE SPREADSHEET DATA
*/
var dictInput = {}; // User input per cell
var dictValue = {}; // Calculated value per cell


/*
 * GRID DIMENSIONS
*/
const numRows = 100;
const numCols = 100; // ISSUE: numCols can only go up to 702


/*
 * COLUMN AND ROW SETUP
*/
$(function () {
    var code1 = 0;
    var code2 = 65; // ISSUE: Only goes up to ZZ
    var i, node;
    // Use a fragment to avoid numerous reflows
    var fragment = document.createDocumentFragment();

    // ADD COLUMN HEADERS
    // Construct each column header
    for (i = 1; i <= numCols; i++) {
        if (code1 === 0) {      // Single letter columns
            node = $('<th>' + String.fromCharCode(code2) + '</th>');
            if (code2 === 90) { // At Z, move to AA
                code1 = 65;
                code2 = 65;
            }
            else {
                code2++;
            }
        }
        else {                  // Double letter columns
            node = $('<th>' + String.fromCharCode(code1) + String.fromCharCode(code2) + '</th>');
            if (code2 === 90) { // e.g. At AZ, move to BA
                code1++;
                code2 = 65;
            }
            else {
                code2++;
            }
        }
        $(fragment).append(node);
    }
    // Add all the column headers to the DOM as a group
    $('.column-header-row').append(fragment);

    // ADD ROW NUMBERS
    fragment = document.createDocumentFragment();
    for (i = 1; i <= numRows; i++) {
        node = $('<tr><td class="row-width">' + i.toString() + '</td></tr>');
        $(fragment).append(node);
    }
    $('.row-numbers').append(fragment);
})


/*
 * GRID SETUP
*/
function addTheCells() {
    var fragment = document.createDocumentFragment();
    var i = 1;

    $('.worksheet').append('<table class="cells"></table>');

    // Add each row to the document fragment
    for (var row = 1; row <= numRows; row++) {
        var newRow = document.createElement('tr');

        // Add each column to the current row
        for (var col = 1; col <= numCols; col++) {
            // data-index is the cell indicator. Column and Row can be derived from it.
            $(newRow).append('<td><input type="text" data-index="' + i.toString() + '"></td>');
            i++;
        }
        $(fragment).append(newRow);
    }

    // Add all the grid to the DOM
    $('.cells').append(fragment);
}

addTheCells();


/*
 *
 * EVENT LISTENERS
 *
 *
*/

/*
 * ALLOW THE COLUMN HEADER AND ROW NUMBERS TO SCROLL ACCORDINGLY
*/
$(window).scroll(function () {
    // Column headers are fixed vertically but scrolls horizontally
    $('.column-header').css('left', (-window.pageXOffset).toString() + 'px');

    // Row indicators are fixed horizontally but scrolls vertically
    // ISSUE: Maintenance problem if the site header is changed because of hardcoded top padding
    $('.row-number-section').css('top', (112 - window.pageYOffset).toString() + 'px');
});


/*
 * CELL FORMATTING (BOLD, ITALIC, UNDERLINE)
*/
$(".worksheet").on("keydown", 'tr', function (e) {

    // Apply CSS style on Ctrl-B, Ctrl-I and Ctrl-U
    if ((e.key === 'b') && (e.ctrlKey === true))
        $(e.target).toggleClass('bold');

    else if ((e.key === 'i') && (e.ctrlKey === true))
        $(e.target).toggleClass('italic');

    // ISSUE: Ctrl-U also opens the source file in a new tab
    else if ((e.key === 'u') && (e.ctrlKey === true))
        $(e.target).toggleClass('underline');
});


/*
 * GET VALUE FROM CELL INDICATOR Ex. A1
*/
function parseAndGetCellValue(input) {
    var rowName = '';
    var colName = '';
    var rowNum = 0;
    var colNum = 0;
    var asciiCode;
    var letterNum;
    var targetElement;
    var i;

    // Separate the column from the row part in the cell ID
    for (i = 0; i < input.length; i++) {
        asciiCode = input[i].charCodeAt();
        if ((asciiCode < 65 || asciiCode > 90) && (colName === ''))
            // Invalid column code
            return null;

        if (asciiCode >= 65 && asciiCode <= 90)
            // Valid column code character
            colName = colName + input[i];
        else {
            rowName = input.slice(i);
            break;
        }
    }

    // Check if row number is valid
    rowNum = Number(rowName);
    if ((rowNum <= 0) || !Number.isInteger(rowNum) || rowNum > numRows)
        return null;

    // Check if column header is valid
    for (i = colName.length - 1; i >= 0; i--) {
        letterNum = colName[i].charCodeAt() - 64;

        colNum += ((26 ** i) * (letterNum - 1)) + (26 ** i);
    }

    if (colNum > numCols)
        // Invalid if exceeding grid size
        return null;

    targetElement = $('.cells tr:nth-child('
        + rowName
        + ') td:nth-child('
        + colNum.toString()
        + ') input');

    if ($(targetElement).data('index') in dictValue)
        return dictValue[$(targetElement).data('index')];
    else
        return 0;
}


/*
 * RETURN OPERANDS AND OPERATORS FROM A FORMULA
*/
function parseFormula(input) {
    var arr = [];
    var tokens = [];
    var isPrevNum = false;
    var isInvalid = false;
    var value;
    var arrCount;

    // Valid formulas start with '='
    if (input.charAt(0) !== '=')
        return null;

    input = input.slice(1); // Remove '='
    if (input === '')
        return null;

    /*
     *  DIFFERENT FORMULA TYPES
     *  1. =SUM(A1:A2)
     *  2. =6
     *  3. =A1
     *  4. =A1*A3-A5+A6/A4
     *  5. =1+2/3*4-5
     */
    // FORMULA TYPE #1: =SUM(A1:A2)
    if (input.includes('SUM')) {

    }
    // Valid formulas have these operators
    if (!(input.includes('*')) &&
        !(input.includes('/')) &&
        !(input.includes('+')) &&
        !(input.includes('-'))) {

        // FORMULA TYPE #2: =6
        // Checking for valid numbers, or cell number e.g., = 6
        if (!isNaN(input.trim()))
            return [input.trim()];

        // FORMULA TYPE #2: =6
        value = parseAndGetCellValue(input);
        return ((value !== null) ? [value] : null);
    }

    // Parse into tokens
    // TODO: Add parentheses support
    arr = input.split(/([\*\/+-])/);
    if (arr.length === 0)
        return null

    // Remove empty array items
    arrCount = arr.length;
    arr.forEach(function (item) {
        if (item !== "")
            tokens.push(item);
    });

    // FORMULA TYPE #4: =A1*A3-A5+A6/A4
    tokens.forEach(function (item, index) {
        // Trim white spaces around, but with white space inside, it's NaN
        tokens[index] = item.trim();

        // Check if operands are valid
        if ((tokens[index] !== '*') &&
            (tokens[index] !== '/') &&
            (tokens[index] !== '+') &&
            (tokens[index] !== '-')) {

            if (isNaN(tokens[index])) {
                // If not a number, check if valid cell indicator: E.g. A1
                // Replace cell indicator with number if valid
                value = parseAndGetCellValue(tokens[index]);
                if (value === null) {
                    isInvalid = true;
                    return;
                }
                else {
                    tokens[index] = value;
                }
            }
        }

        // FORMULA TYPE #5: =1+2/3*4-5
        // Check order of numbers and operators
        // Should start and end with number, no 2 numbers or 2 operators together
        // TODO: Support for unary operators + and -
        if (!isPrevNum) { // Expect number here
            if ((tokens[index] !== '*') &&
                (tokens[index] !== '/') &&
                (tokens[index] !== '+') &&
                (tokens[index] !== '-'))
                isPrevNum = true;
            else {
                isInvalid = true;
                return;
            }
        }
        else { // Expect operator here
            if ((tokens[index] !== '*') &&
                (tokens[index] !== '/') &&
                (tokens[index] !== '+') &&
                (tokens[index] !== '-')) {
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

    // Invalid formulas are treated as strings
    if (isInvalid)
        return null;

    // Array of tokens (numbers and operators in correct order)
    return tokens;
}


/*
 * MULTIPLICATION AND DIVISION OPERATIONS IN THE FORMULA
*/
function multiplyDivide(arr) {
    var arrEq = [];
    var i;
    var justPush = true;

    // No multiplication or division needed if operators are not present
    var found = arr.find(function (element) {
        return (element === '*' || element === '/');
    });
    if (!found)
        return arr;

    for (i = 0; i < arr.length; i++) {
        if ((arr[i + 1] !== '*') && (arr[i + 1] !== '/') && justPush) {
            // Multiplication and division not to be performed
            // Continue traversing the array of tokens
            arrEq.push(arr[i]);
            continue;
        }
        else {
            // Do computations. Product or quotient goes in the array
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

    // Call recursively until all multiplications and divisions
    // have been performed
    if (arrEq.Length !== 1)
        return multiplyDivide(arrEq);
    else
        return arrEq;
}


/*
 * ADDITION AND SUBTRACTION OPERATIONS IN THE FORMULA
*/
function addSubtract(arr) {
    var answer;

    // Traverse the array of tokens and get the final answer
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


/*
 * GET AND SAVE AN INPUT
*/
$('.worksheet').on('change', 'input', function (e) {
    var input = $(e.target).val();

    // Empty string value
    if (input === '') {
        if ($(e.target).data('index') in dictInput)
            delete dictInput[$(e.target).data('index')];
        return;
    }

    // Save the string or formula
    dictInput[$(e.target).data('index')] = input;

    // Check the input
    if (!isNaN(input)) {
        // Value is a number -> Save
        // TODO: Comma-separated numbers are not yet recognized as numbers
        dictValue[$(e.target).data('index')] = input;
    }
    else {
        var arr = parseFormula(input);
        if (arr == null) // Input is a string and not a formula
            return;

        // Multiplication and Division has higher precedence
        var arrMd = multiplyDivide(arr);
        if (arrMd.length === 1)
            value = arrMd[0];
        else
            value = addSubtract(arrMd);

        // Computation is done. Save to global variable
        if (!isNaN(value)) {
            dictValue[$(e.target).data('index')] = value;
            $(e.target).val(value);
        }
    }
});


/*
 * UPDATE THE TEXT FIELDS IN THE HEADER
*/
$('.worksheet').on('focus', 'input', function (e) {
    // If there is an entry previously, show that string
    if ($(e.target).data('index') in dictInput)
        $('.cell-input').val(dictInput[$(this).data('index')]);
    else
        $('.cell-input').val('');

    // Fix for NaN appearing in the cell field on click
    if (isNaN($(e.target).data('index'))) {
        $('.cell-selected').val('');
        return;
    }

    // Convert index to column and row number
    var row = Math.ceil($(e.target).data('index') / numCols);

    // ISSUE: Only supports double-letter columns
    var col = $(e.target).data('index') % numCols;
    if (col === 0)
        col = 100;
    var colString = '';

    // ASCII Code of A=65,...,Z=90
    if (Math.ceil(col / 26) > 1)
        colString += String.fromCharCode(Math.ceil(col / 26) + 63);

    if ((col % 26) === 0)
        colString += String.fromCharCode(90);
    else
        colString += String.fromCharCode((col % 26) + 64);

    $('.cell-selected').val(colString + row.toString());
});


/*
 * REPAINT THE GRID AND PUT THE DATA BACK
*/
$('.button-refresh').click(function () {
    // Delete cells
    var cells = $('.cells').detach();

    // Put the grid back
    cells.appendTo($('.worksheet'));

    // Put data back from the dictionary
    for (var key in dictInput) {
        var row = Math.ceil(key / numCols);
        var col = (key % 100) === 0 ? 100 : (key % 100);
        var target = $('.cells tr:nth-child('
            + row.toString()
            + ') td:nth-child('
            + col.toString()
            + ') input');

        // Cell value is in dictValue if there is a computed value
        // or in dictInput if it is a string
        if (key in dictValue)
            $(target).val(dictValue[key]);
        else
            $(target).val(dictInput[key]);
    }

    // It looks like nothing happened without an alert
    alert('Spreadsheet has been refreshed.');
});