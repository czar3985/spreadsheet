var dictInput={};var dictValue={};var listDependencies=[];var elementsToRemember=[];var elementToChange;var triggerFromAnotherInput=!1;const numRows=100;const numCols=100;$(function(){var code1=0;var code2=65;var i,node;var fragment=document.createDocumentFragment();for(i=1;i<=numCols;i++){if(code1===0){node=$('<th>'+String.fromCharCode(code2)+'</th>');if(code2===90){code1=65;code2=65}
else{code2++}}
else{node=$('<th>'+String.fromCharCode(code1)+String.fromCharCode(code2)+'</th>');if(code2===90){code1++;code2=65}
else{code2++}}
$(fragment).append(node)}
$('.column-header-row').append(fragment);fragment=document.createDocumentFragment();for(i=1;i<=numRows;i++){node=$('<tr><td class="row-width">'+i.toString()+'</td></tr>');$(fragment).append(node)}
$('.row-numbers').append(fragment)})
function addTheCells(){var fragment=document.createDocumentFragment();var i=1;$('.worksheet').append('<table class="cells"></table>');for(var row=1;row<=numRows;row++){var newRow=document.createElement('tr');for(var col=1;col<=numCols;col++){$(newRow).append('<td><input type="text" data-index="'+i.toString()+'"></td>');i++}
$(fragment).append(newRow)}
$('.cells').append(fragment)}
addTheCells();$(window).scroll(function(){$('.column-header').css('left',(-window.pageXOffset).toString()+'px');$('.row-number-section').css('top',(112-window.pageYOffset).toString()+'px')});$('.worksheet').on('keydown','tr',function(e){if((e.key==='b')&&(e.ctrlKey===!0))
$(e.target).toggleClass('bold');else if((e.key==='i')&&(e.ctrlKey===!0))
$(e.target).toggleClass('italic');else if((e.key==='u')&&(e.ctrlKey===!0))
$(e.target).toggleClass('underline')});function checkNoCircularReference(affectedElement,targetElement){var isValid=!0;if($(affectedElement).data('index')==$(targetElement).data('index')){return!1}
listDependencies.forEach(function(dependency){if($(affectedElement).data('index')==$(dependency[0]).data('index')){if($(targetElement).data('index')==$(dependency[1]).data('index')){isValid=!1;return}
else{isValid=checkNoCircularReference(dependency[1],targetElement);if(!isValid)
return}}});return isValid}
function parseAndGetCellValue(input){var rowName='';var colName='';var rowNum=0;var colNum=0;var asciiCode;var letterNum;var targetElement;var i;var charPointer;for(i=0;i<input.length;i++){asciiCode=input[i].charCodeAt();if((asciiCode<65||asciiCode>90)&&(colName===''))
return null;if(asciiCode>=65&&asciiCode<=90)
colName=colName+input[i];else{rowName=input.slice(i);break}}
rowNum=Number(rowName);if((rowNum<=0)||!Number.isInteger(rowNum)||rowNum>numRows)
return null;for(i=colName.length-1,charPointer=0;i>=0;i--,charPointer++){letterNum=colName[charPointer].charCodeAt()-64;colNum+=((26**i)*(letterNum-1))+(26**i)}
if(colNum>numCols)
return null;targetElement=$('.cells tr:nth-child('+rowName+') td:nth-child('+colNum.toString()+') input');if(!checkNoCircularReference(elementToChange,targetElement))
return null;elementsToRemember.push(targetElement);if($(targetElement).data('index')in dictValue)
return dictValue[$(targetElement).data('index')];else return 0}
function getTokensFromSumRange(range){var i;var firstCode='';var secondCode='';var firstCol='';var secondCol='';var firstRow='';var secondRow='';var formula='';for(i=0;i<range.length&&range[i]!==':';i++)
firstCode+=range[i];secondCode=range.slice(i+1);for(i=0;i<firstCode.length&&isNaN(firstCode[i]);i++)
firstCol+=firstCode[i];firstRow=firstCode.slice(i);for(i=0;i<secondCode.length&&isNaN(secondCode[i]);i++)
secondCol+=secondCode[i];secondRow=secondCode.slice(i);if(firstCol==secondCol){var firstNumInSeries=Number(firstRow);var lastNumInSeries=Number(secondRow);if(firstNumInSeries>lastNumInSeries){firstNumInSeries=Number(secondRow);lastNumInSeries=Number(firstRow)}
for(i=firstNumInSeries;i<=lastNumInSeries;i++){formula+=firstCol+i.toString();if(i!=lastNumInSeries)
formula+='+'}
return formula}}
function setDependencies(){for(var i=listDependencies.length-1;i>=0;i--){if($(listDependencies[i])[1].data('index')==$(elementToChange).data('index'))
listDependencies.splice(i,1)}
elementsToRemember.forEach(function(element){listDependencies.push([element,elementToChange])});elementsToRemember=[]}
function parseFormula(input){var arr=[];var tokens=[];var isPrevNum=!1;var isInvalid=!1;var value;var arrCount;if(input.charAt(0)!=='=')
return null;input=input.slice(1);if(input==='')
return null;if((input.slice(0,4)==='SUM(')&&(input.charAt(input.length-1)===')')&&(input.includes(':'))){input=getTokensFromSumRange(input.slice(4,input.length-1))}
if(!(input.includes('*'))&&!(input.includes('/'))&&!(input.includes('+'))&&!(input.includes('-'))){if(!isNaN(input.trim()))
return[input.trim()];value=parseAndGetCellValue(input);return value!==null?[value]:null}
arr=input.split(/([\*\/+-])/);if(arr.length===0)
return null
arrCount=arr.length;arr.forEach(function(item){if(item!=='')
tokens.push(item)});tokens.forEach(function(item,index){tokens[index]=item.trim();if((tokens[index]!=='*')&&(tokens[index]!=='/')&&(tokens[index]!=='+')&&(tokens[index]!=='-')){if(isNaN(tokens[index])){value=parseAndGetCellValue(tokens[index]);if(value===null){isInvalid=!0;return}
else{tokens[index]=value}}}
if(!isPrevNum){if((tokens[index]!=='*')&&(tokens[index]!=='/')&&(tokens[index]!=='+')&&(tokens[index]!=='-'))
isPrevNum=!0;else{isInvalid=!0;return}}
else{if((tokens[index]!=='*')&&(tokens[index]!=='/')&&(tokens[index]!=='+')&&(tokens[index]!=='-')){isInvalid=!0;return}
else if(index===arrCount-1){isInvalid=!0;return}
else isPrevNum=!1}});if(isInvalid)
return null;return tokens}
function multiplyDivide(arr){var arrEq=[];var i;var justPush=!0;var found=arr.find(function(element){return(element==='*'||element==='/')});if(!found)
return arr;for(i=0;i<arr.length;i++){if((arr[i+1]!=='*')&&(arr[i+1]!=='/')&&justPush){arrEq.push(arr[i]);continue}
else{var num;if(arr[i+1]==='*')
num=arr[i]*arr[i+2];else num=arr[i]/arr[i+2];arrEq.push(num);i+=2;justPush=!0}}
if(arrEq.Length!==1)
return multiplyDivide(arrEq);else return arrEq}
function addSubtract(arr){var answer;for(var i=0,answer=Number(arr[i]);i<arr.length-1;i+=2){if(arr[i+1]==='+'){answer=answer+Number(arr[i+2])}
else{answer=answer-Number(arr[i+2])}}
return answer}
function recomputeAffectedElements(elementId){listDependencies.forEach(function(dependency){if($(dependency[0]).data('index')==elementId){triggerFromAnotherInput=!0;$(dependency[1]).triggerHandler('change')}})}
$('input').change(function(e){var input=$(this).val();var elementId=$(this).data('index');elementToChange=$(this);elementsToRemember=[];if(triggerFromAnotherInput){if(elementId in dictInput)
input=dictInput[elementId]}
if(input===''){if(elementId in dictInput)
delete dictInput[elementId];if(elementId in dictValue)
delete dictValue[elementId];setDependencies();recomputeAffectedElements(elementId);return}
dictInput[elementId]=input;if(!isNaN(input)){dictValue[elementId]=input;setDependencies()}
else{var arr=parseFormula(input);if(arr==null){if(elementId in dictValue)
delete dictValue[elementId];setDependencies();recomputeAffectedElements(elementId);return}
var arrMd=multiplyDivide(arr);if(arrMd.length===1)
value=arrMd[0];else value=addSubtract(arrMd);if(!isNaN(value)){dictValue[elementId]=value;$(this).val(value)}
if(!triggerFromAnotherInput)
setDependencies();else triggerFromAnotherInput=!1}
recomputeAffectedElements(elementId)});$('input').focus(function(e){if($(this).data('index')in dictInput)
$('.cell-input').val(dictInput[$(this).data('index')]);else $('.cell-input').val('');var row=Math.ceil($(this).data('index')/numCols);var col=$(this).data('index')%numCols;if(col===0)
col=100;var colString='';if(Math.ceil(col/26)>1)
colString+=String.fromCharCode(Math.ceil(col/26)+63);if((col%26)===0)
colString+=String.fromCharCode(90);else colString+=String.fromCharCode((col%26)+64);$('.cell-selected').val(colString+row.toString())});$('.button-refresh').click(function(){var cells=$('.cells').detach();cells.appendTo($('.worksheet'));for(var key in dictInput){var row=Math.ceil(key/numCols);var col=(key%100)===0?100:(key%100);var target=$('.cells tr:nth-child('+row.toString()+') td:nth-child('+col.toString()+') input');if(key in dictValue)
$(target).val(dictValue[key]);else $(target).val(dictInput[key])}
alert('Spreadsheet has been refreshed.')})