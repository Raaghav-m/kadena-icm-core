(namespace 'free)
(define-keyset "free.cka-admin-keyset" (read-keyset 'cka-admin-keyset))

(module cka-message-store-v1 GOVERNANCE
  "Create Kadena App message store"

  (defcap GOVERNANCE ()
    "Module governance capability that only allows the admin to update this module"
    (enforce-keyset "free.cka-admin-keyset"))
  (use coin [ details ])

  (defcap ACCOUNT-OWNER (account:string)
    "Make sure the requester owns the KDA account"
    (enforce-guard (at 'guard (details account)))
  )

  (defschema messages-schema
    "Candidates table schema"

    message:string
  )

  (deftable messages:{messages-schema})

  (defun write-message (account:string message:string)
    "Write a message"

    (enforce (<= (length message) 150) "Message can be a maximum of 150 characters long")

    (with-capability (ACCOUNT-OWNER account)
      (write messages account { "message" : message })
    )
  )

  (defun read-message (account:string)
    "Read a message for a specific account"

    (with-default-read messages account
      { "message": "You haven't written any message yet" }
      { "message" := message }
      message
    )
  )
)

(if (read-msg "upgrade")
  ["upgrade"]
  [
    (create-table messages)
  ]
)
