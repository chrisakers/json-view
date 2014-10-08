// Add polyfill for Array.isArray() if needed

(function (global) {
    var TYPE_WHITESPACE = 'whitespace',
        TYPE_LINE_BREAK = 'line_break',
        TYPE_STRING = 'string',
        TYPE_STRING_OPEN_QUOTE = 'string_open_quote',
        TYPE_STRING_CHARACTERS = 'string_characters',
        TYPE_STRING_CLOSE_QUOTE = 'string_close_quote',
        TYPE_NUMBER = 'number',
        TYPE_BOOLEAN = 'boolean',
        TYPE_NULL = 'null',
        TYPE_ARRAY = 'array',
        TYPE_ARRAY_OPEN_BRACKET = 'array_open_bracket',
        TYPE_ARRAY_CLOSE_BRACKET = 'array_close_bracket',
        TYPE_ARRAY_ELEMENT_SEPARATOR = 'array_element_separator',
        TYPE_OBJECT = 'object',
        TYPE_OBJECT_OPEN_BRACKET = 'object_open_bracket',
        TYPE_OBJECT_CLOSE_BRACKET = 'object_close_bracket',
        TYPE_OBJECT_KEY_VALUE_PAIR = 'object_key_value_pair',
        TYPE_OBJECT_KEY = 'object_key',
        TYPE_OBJECT_VALUE = 'object_value',
        TYPE_OBJECT_KEY_VALUE_SEPARATOR = 'object_key_value_separator',
        TYPE_OBJECT_PAIRS_SEPARATOR = 'object_pairs_separator',
        TYPE_UNDEFINED = 'undefined',
        TYPE_FUNCTION = 'function',
        TYPE_DATE = 'date',
        DEFAULT = 'default',
        OUT = 'out';

    var defaults = {
        indentChar: ' ',
        indentMultiple: 4,
        indentStart: 0,
        eol: '\n',
        prepend: '<pre>',
        append: '</pre>',
        serializers: obj(
            TYPE_ARRAY, function (arr, lvl, opts) {
                var content = [];
                content.push({type: TYPE_ARRAY_OPEN_BRACKET, content: '['});
                if (arr.length) {
                    content.push({type: TYPE_LINE_BREAK, content: opts.eol});
                    arr.forEach(function (element) {
                        content.push({type: TYPE_WHITESPACE, content: opts.indent(lvl + 1)});
                        content.push(opts.serializers[OUT](element, lvl + 1, opts));
                        content.push({type: TYPE_ARRAY_ELEMENT_SEPARATOR, content: ','});
                        content.push({type: TYPE_LINE_BREAK, content: opts.eol});
                    });
                    content.splice(-2, 1); //remove the last comma
                    content.push({type: TYPE_WHITESPACE, content: opts.indent(lvl)});
                }
                content.push({type: TYPE_ARRAY_CLOSE_BRACKET, content: ']'});
                return {
                    type: TYPE_ARRAY,
                    content: content
                };
            },
            TYPE_OBJECT, function (o, lvl, opts) {
                var content = [];
                var keys = Object.keys(o);
                content.push({type: TYPE_OBJECT_OPEN_BRACKET, content: '{'});
                if (keys.length) {
                    content.push({type: TYPE_LINE_BREAK, content: opts.eol});
                    keys.forEach(function (key) {
                        content.push({type: TYPE_WHITESPACE, content: opts.indent(lvl + 1)});
                        content.push({type: TYPE_OBJECT_KEY_VALUE_PAIR, content: [
                            {type: TYPE_OBJECT_KEY, content: opts.serializers[TYPE_STRING](key)},
                            {type: TYPE_OBJECT_KEY_VALUE_SEPARATOR, content: ':'},
                            {type: TYPE_WHITESPACE, content: ' '},
                            {type: TYPE_OBJECT_VALUE, content: opts.serializers[OUT](o[key], lvl + 1, opts)}
                        ]});
                        content.push({type: TYPE_OBJECT_PAIRS_SEPARATOR, content: ','});
                        content.push({type: TYPE_LINE_BREAK, content: opts.eol});
                    });
                    content.splice(-2, 1); //remove the last comma
                    content.push({type: TYPE_WHITESPACE, content: opts.indent(lvl)});
                }
                content.push({type: TYPE_OBJECT_CLOSE_BRACKET, content: '}'});
                return {
                    type: TYPE_OBJECT,
                    content: content
                };
            },
            TYPE_STRING, function (val, lvl, opts) {
                var json = JSON.stringify(val);
                return {
                    type: TYPE_STRING,
                    content: [
                        {type: TYPE_STRING_OPEN_QUOTE, content: '"'},
                        {type: TYPE_STRING_CHARACTERS, content: json.slice(1, -1)},
                        {type: TYPE_STRING_CLOSE_QUOTE, content: '"'}
                    ]
                };
            },
            DEFAULT, function (val, lvl, opts, type) {
                return {
                    type: type,
                    content: JSON.stringify(val)
                };
            },
            OUT, function (val, lvl, opts) {
                var type = typeOf(val);
                return (this[type] || this[DEFAULT])(val, lvl, opts, type);
            }
        ),
        html: obj(
            OUT, function (token) {
                switch (typeOf(token)) {
                    case TYPE_STRING:
                        return token;
                    case TYPE_ARRAY:
                        return token.map(this[OUT], this).join('');
                    case TYPE_OBJECT:
                        return '<span class=' + token.type + '>' + this[OUT](token.content) + '</span>';
                    default:
                        console.log('unexpected', token);
                }
            }
        ),
        indent: (function (cache) {
            return function (lvl) {
                var key = 'k_' + this.indentChar + '_' + this.indentMultiple + '_' + lvl;
                return cache[key] || (cache[key] = new Array(lvl * this.indentMultiple + 1).join(this.indentChar));
            };
        })({})
    };

    function merge(target) {
        //going to need a deep merge
        var i = 1,
            donor,
            donate = function (key) {
                target[key] = donor[key];
            };
        for (;(donor = arguments[i++]);) {
            Object.keys(donor).forEach(donate);
        }
        return target;
    }
    
    function obj() {
        var o = {},
            i = 0,
            len = arguments.length;
        while (i < len) {
           o[arguments[i++]] = arguments[i++];
        }
        return o;
    }

    function typeOf(o) {
        var type = typeof o;
        switch (type) {
            case TYPE_STRING:
            case TYPE_NUMBER:
            case TYPE_BOOLEAN:
            case TYPE_UNDEFINED:
            case TYPE_FUNCTION:
                return type;
        }
        if (o instanceof Date) return TYPE_DATE;
        if (Array.isArray(o)) return TYPE_ARRAY;
        if (o === null) return TYPE_NULL;
        return TYPE_OBJECT;
    }

    function jsonview(jsonString, opts) {
        var options = merge({}, defaults, opts);
        var o = JSON.parse(jsonString);
        var syntaxTree = options.serializers[OUT](o, options.indentStart, options);
        return options.prepend + options.html[OUT](syntaxTree) + options.append;
    }

    if (typeof module !== TYPE_UNDEFINED && typeof module.exports !== TYPE_UNDEFINED) {
        module.exports = jsonview;
    } else {
        global.jsonview = jsonview;
    }
})(this);
