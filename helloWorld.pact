(namespace 'free)
;;
;; Modified "Hello, world!" module
;; 
;;-----------------------------------------------------------------------
;;
;;  Use semicolons (;) for comments in smart contracts.
;;  By convention, use:
;;  
;;  - A single semicolon (;) for short notes on a single line of code. 
;;  - Two semicolons (;;) to describe functions or other top-level forms.
;;  - Three semicolons (;;;) to separate larger sections of code.
;;
;;  In this example, the module defines a table for storing greeting
;;  names and two functions:
;; 
;;  - (say-hello-to "name")
;;  - (greet)
;;
;;-----------------------------------------------------------------------

(module helloWorld-mod GOVERNANCE
  @doc "Update the hello-world project to store names."
  
  (defcap GOVERNANCE () true)
  
  (defschema hello-schema
    @doc "Add a schema to store the 'name' variable for the greeting recipient."
    name:string)

  (deftable names:{hello-schema})

  (defun say-hello-to (name)
    @doc "Store 'name' to say hello with."
    (write names "name" { 'name: name }))

  (defun greet ()
    @doc "Say hello using the stored 'name' from the hellos table."
    (with-read names "name" { "name" := name }
      (format "Hello, {}!" [name])))
)

(create-table names)

(say-hello-to "world") ; store greeting recipient "world" in the names table
(greet)                ; say hello!