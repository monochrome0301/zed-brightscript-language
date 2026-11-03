; Inject BrightScript / BrighterScript into SceneGraph <script> elements.
;
; The `type` attribute decides the language:
;   text/brighterscript -> brighter-script
;   text/brightscript   -> brightscript
; Script bodies appear either as plain text (CharData) or wrapped in
; <![CDATA[ ... ]]> (CDSect/CData).

; script element typed brighterscript, plain text
(element
  (STag
    (Name) @_tag
    (Attribute
      (Name) @_attr
      (AttValue) @_val))
  (content
    (CharData) @injection.content)
  (#eq? @_tag "script")
  (#eq? @_attr "type")
  (#match? @_val "brighterscript")
  (#set! injection.language "brighter-script"))

; script element typed brighterscript, CDATA
(element
  (STag
    (Name) @_tag
    (Attribute
      (Name) @_attr
      (AttValue) @_val))
  (content
    (CDSect
      (CData) @injection.content))
  (#eq? @_tag "script")
  (#eq? @_attr "type")
  (#match? @_val "brighterscript")
  (#set! injection.language "brighter-script"))

; script element typed brightscript, plain text
(element
  (STag
    (Name) @_tag
    (Attribute
      (Name) @_attr
      (AttValue) @_val))
  (content
    (CharData) @injection.content)
  (#eq? @_tag "script")
  (#eq? @_attr "type")
  (#match? @_val "text/brightscript")
  (#set! injection.language "brightscript"))

; script element typed brightscript, CDATA
(element
  (STag
    (Name) @_tag
    (Attribute
      (Name) @_attr
      (AttValue) @_val))
  (content
    (CDSect
      (CData) @injection.content))
  (#eq? @_tag "script")
  (#eq? @_attr "type")
  (#match? @_val "text/brightscript")
  (#set! injection.language "brightscript"))
