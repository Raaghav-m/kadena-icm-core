(namespace 'free)

(define-keyset "free.cka-admin-keyset" (read-keyset "cka-admin-keyset"))

(module simple-vote GOVERNANCE
  (defcap GOVERNANCE ()
    "Allows admin to upgrade or change the module"
    (enforce-keyset "free.cka-admin-keyset"))

  (defschema poll-sch
    question:string
    options:[string])    ; e.g. ["A","B","C"]
  (deftable poll:{poll-sch})

  (defschema vote-sch
    choice:string)
  (deftable votes:{vote-sch})

  ;; Admin sets the poll (once)
  (defun create-poll:string (question:string options:[string])
    (with-capability (GOVERNANCE)
      (insert poll "" {'question:question, 'options:options}))
    "Poll created")

  ;; User votes (only once)
  (defun vote:string (user:string choice:string)
    (with-read poll "" {'options:=opts}
      (enforce (contains choice opts) "Invalid option")
      (with-default-read votes user {'choice:""} {'choice:=existing}
        (enforce (= existing "") "You already voted")
        (write votes user {'choice:choice})))
    "Vote recorded")

  ;; Anyone can get results
  (defun get-votes:[object{vote-sch}] ()
    (select votes (constantly true))
  )
)

(if (read-msg "upgrade")
  ["upgrade"]
  [
    (create-table poll)
    (create-table votes)
  ]
)
