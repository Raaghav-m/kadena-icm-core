(namespace 'free)

(define-keyset "free.cka-admin-keyset" (read-keyset "cka-admin-keyset"))

(module simple-todo GOVERNANCE
  (defcap GOVERNANCE ()
    "Allows admin to upgrade or change the module"
    (enforce-keyset "free.cka-admin-keyset"))

  ;; Each task belongs to a user
  (defschema task-sch
    user:string
    title:string
    done:bool)

  (deftable tasks:{task-sch})

  ;; Add a task (same as before)
  (defun add-task:string (user:string title:string)
    (let* ((all (select tasks (where 'user (= user))))
           (new-id (format "{}-{}" [user (length all)])))
      (insert tasks new-id {'user:user, 'title:title, 'done:false}))
    "Task added")

  ;; ✅ COMPLETE TASK BY USER + TITLE (not task-id)
  (defun complete-task:string (user:string title:string)
    ;; Get all tasks for the user and find the matching one
    (let* ((user-tasks (select tasks (where 'user (= user))))
           (num-tasks (length user-tasks)))
      ;; Search through all tasks to find the one with matching title
      (let ((task-index 
              (fold (lambda (acc idx)
                      (if (= acc -1)
                        (let ((task (at idx user-tasks)))
                          (if (= (at 'title task) title) idx acc))
                        acc))
                    -1
                    (enumerate 0 (- num-tasks 1)))))
        (enforce (!= task-index -1) "Task not found")
        ;; Construct the task-id from user and index
        (let ((task-id (format "{}-{}" [user task-index])))
          (with-read tasks task-id {'user:=u, 'title:=t}
            (update tasks task-id {'user:u, 'title:t, 'done:true})))))
    "Task completed")

  ;; Get all tasks for a user
  (defun get-tasks:[object{task-sch}] (user:string)
    (select tasks (where 'user (= user)))
  )
)

(if (read-msg "upgrade")
  ["upgrade"]
  [
    (create-table tasks)
  ]
)

