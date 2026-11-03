(_
  "("
  ")" @end) @indent

(_
  "["
  "]" @end) @indent

(_
  "{"
  "}" @end) @indent

(function_declaration) @start.function

(if_statement) @start.if

(else_if_statement) @start.elseif

(else_statement) @start.else

(for_statement) @start.for

(while_statement) @start.while

(try_statement) @start.try

(preproc_if_statement) @start.preproc_if

(preproc_else_if_clause) @start.preproc_elseif

(preproc_else_clause) @start.preproc_else
