(function_declaration
  body: (_
    (_) @end.inside)?) @function.around

(class_declaration
  body: (_) @end.inside) @class.around

(interface_declaration
  body: (_) @end.inside) @class.around

(enum_declaration
  body: (_) @end.inside) @enum.around

(enum_member) @item.around

(namespace_declaration
  body: (_
    (_) @end.inside)?) @namespace.around

(if_statement
  consequence: (_
    (_) @end.inside)?) @conditional.around

(for_statement
  body: (_
    (_) @end.inside)?) @loop.around

(while_statement
  body: (_
    (_) @end.inside)?) @loop.around

(try_statement) @exception.around
