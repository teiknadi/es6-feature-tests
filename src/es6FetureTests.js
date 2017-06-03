global = (typeof global != "undefined") ? global : runCode("return this");

function runCode(code) {
    return (new Function(code))();
}

var Es6FetureTests = (function Test(document) {
    var testCases = {
        // syntax
        letConst: { passes: "'use strict'; let a; const b = 2;" },
        letLoop: { passes: "'use strict'; for(let i in {}){}; for(let i=0;;){break}" },
        constLoop: { passes: "'use strict'; for(const i in {}){}; for (const i=0;;){break}" },
        defaultParameter: { passes: "'use strict'; function a(b=2){}" },
        spreadRest: { passes: "'use strict'; var a = [1,2]; +function b(...c){}(...a);" },
        destructuring: { passes: "'use strict'; var a = [1,2], [b,c] = a, d = {e:1,f:2}, {e:E,f} = d;" },
        parameterDestructuring: { passes: "'use strict'; function a({b,c}){}" },
        templateString: { passes: "'use strict'; var a = 1, b = `c${a}d`;" },
        forOf: { passes: "'use strict'; for (var a of [1]) {}" },
        arrow: { passes: "'use strict'; var a = () => {};" },
        generator: { passes: "'use strict'; function *a(){ yield; }" },
        conciseMethodProperty: { passes: "'use strict'; var a = 1, b = { c(){}, a };" },
        computedProperty: { passes: "'use strict'; var a = 1, b = { ['x'+a]: 2 };" },
        moduleExport: { passes: "'use strict'; export var a = 1;" },
        moduleImport: { passes: "'use strict'; import {a} from 'b';" },
        classes: { passes: "'use strict'; class Foo {}; class Bar extends Foo {};" },
        numericLiteral: { passes: "'use strict'; var a = 0o1, b = 0b10;" },
        oldOctalLiteral: { passes: "var a = 01;" },
        symbol: { passes: "'use strict'; var a = Symbol('b');" },
        unicodeEscape: { passes: "'use strict'; var a = '\\u{20BB7}';" },
        unicodeIdentifier: { passes: "'use strict'; var \\u{20BB7};" },
        unicodeRegExp: { passes: "'use strict'; var a = /\\u{20BB7}/u;" },
        stickyRegExp: { passes: "'use strict'; var a = /b/y;" },

        // semantics
        letTDZ: { dependencies: ["letConst"], fails: "'use strict'; a = 1; let a;" },
        letLoopScope: { dependencies: ["letLoop","forOf"], passes: "'use strict'; var x=[],i=0;for(let i=2;i<3;i++){x.push(function(){return i})};for(let i in {3:0}){x.push(function(){return i})};for(let i of [4]){x.push(function(){return i})};if(x[0]()*x[1]()*x[2]()!=24) throw 0;" },
        constRedef: { dependencies: ["letConst"], fails: "'use strict'; const a = 1; a = 2;" },
        objectProto: { passes: "'use strict'; var a = { b: 2 }, c = { __proto__: a }; if (c.b !== 2) throw 0;" },
        objectSuper: { passes: "'use strict'; var a = { b: 2 }, c = { d() { return super.b; } }; Object.setPrototypeOf(c,a); if (c.d() !== 2) throw 0;" },
        extendNatives: { dependencies: ["classes"], passes: "'use strict'; class Foo extends Array { }; var a = new Foo(); a.push(1,2,3); if (a.length !== 3) throw 0;" },
        TCO: { passes: "'use strict'; +function a(b){ if (b<6E4) a(b+1); }(0);" },
        symbolImplicitCoercion: { fails: "'use strict'; var a = Symbol('a'); a + '';" },
        functionNameInference: { passes: "'use strict'; var a = { b: function(){} }; if (a.name != 'b') throw 0;" },

        // APIs
        ObjectStatics: { is: "'use strict'; return ('getOwnPropertySymbols' in Object) && ('assign' in Object) && ('is' in Object);" },
        ArrayStatics: { is: "'use strict'; return ('from' in Array) && ('of' in Array);" },
        ArrayMethods: { is: "'use strict'; return ('fill' in Array.prototype) && ('find' in Array.prototype) && ('findIndex' in Array.prototype) && ('entries' in Array.prototype) && ('keys' in Array.prototype) && ('values' in Array.prototype);" },
        TypedArrays: { is: "'use strict'; return ('ArrayBuffer' in global) && ('Int8Array' in global) && ('Uint8Array' in global) && ('Int32Array' in global) && ('Float64Array' in global);" },
        TypedArrayStatics: { dependencies: ["TypedArrays"], is: "'use strict'; return ('from' in Uint32Array) && ('of' in Uint32Array);" },
        TypedArrayMethods: { dependencies: ["TypedArrays"], is: "'use strict'; var x = new Int8Array(1); return ('slice' in x) && ('join' in x) && ('map' in x) && ('forEach' in x);" },
        StringMethods: { is: "'use strict'; return ('includes' in String.prototype) && ('repeat' in String.prototype);" },
        NumberStatics: { is: "'use strict'; return ('isNaN' in Number) && ('isInteger' in Number);" },
        MathStatics: { is: "'use strict'; return ('hypot' in Math) && ('acosh' in Math) && ('imul' in Math);" },
        collections: { is: "'use strict'; return ('Map' in global) && ('Set' in global) && ('WeakMap' in global) && ('WeakSet' in global);" },
        Proxy: { is: "'use strict'; return ('Proxy' in global);" },
        Promise: { is: "'use strict'; return ('Promise' in global);" }
    };

    function tryToPassOrFail(code) {
        try {
            runCode(code);

            return true;
        }
        catch (err) {
            return false;
        }
    }

    function tryToReturn(code) {
        try {
            return runCode(code);
        }
        catch (err) {
            return false;
        }
    }

    function runTests() {
        var res = {};

        // run the tests
        Object.keys(testCases).forEach(function eacher(key) {
            var code;

            if (code = testCases[key].passes) {
                res[key] = { code: code, result: tryToPassOrFail(code) };
            } else if (code = testCases[key].fails) {
                res[key] = { code: code, result: !tryToPassOrFail(code) };
            } else if (code = testCases[key].is) {
                res[key] = { code: code, result: tryToReturn(code) };
            } else if (code = testCases[key].not) {
                res[key] = { code: code, result: !tryToReturn(code) };
            }
        });

        // re-run to check for dependency failures
        Object.keys(testCases).forEach(function eacher(key) {
            var code;

            if (code = testCases[key].dependencies) {
                // did any of the listed dependencies already fail?
                if (!code.reduce(
                    function reducer(prev, curr) {
                        return prev && testCases[curr];
                    },
                    true
                )) {
                    res[key] = { code: code, result: false };
                }
            }
        });

        return res;
    }

    function showResultsInTable() {
        var testResults = runTests();
        var table = document.createElement('table');

        Object.keys(testResults).forEach(function eacher(key) {
            var tr = document.createElement('tr');

            var td1 = document.createElement('td');
            var td2 = document.createElement('td');

            var strong = document.createElement('strong');
            var small = document.createElement('small');
            var span = document.createElement('span');

            var res = testResults[key];

            strong.innerHTML = key;
            small.innerHTML = res.code;
            span.innerHTML = res.result;
            span.className = res.result ? 'success' : 'fail';

            td1.appendChild(strong);
            td1.appendChild(small);
            td2.appendChild(span);

            tr.appendChild(td1);
            tr.appendChild(td2);

            table.appendChild(tr);
        });

        document.body.appendChild(table);
    }

    function showResultsInJson(testResults) {
        var res = {};
        var testResults = runTests();
        var pre = document.createElement('pre');

        Object.keys(testResults).forEach(function eacher(key) {
            res[key] = testResults[key].result;
        });

        pre.innerHTML = JSON.stringify(res, null, 2);

        document.body.appendChild(pre);
    }

    return {
        showTable: showResultsInTable,
        showJson: showResultsInJson
    }
})(document);