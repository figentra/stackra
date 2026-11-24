# Task 4: a list-and-edit page

The app keeps to-do items (see the starting app). Add two server-rendered HTML pages over the same items, with
forms that work without any script. The tests read the pages over HTTP, so the markers below are exact.

**List page, `GET /ui/tasks`** (`200`, `text/html`)

- A container with `data-testid="task-list"` holds one element per task with `data-testid="task-row"` and
  `data-task-id="<id>"`, in creation order. Inside a row: `data-testid="task-title"` holds the title as text,
  `data-testid="task-done"` holds the word `done` or `open`, and `data-testid="task-edit-link"` is an `<a>` whose
  `href` is `/ui/tasks/<id>/edit`.
- With no tasks to show, there is no `task-row` and an element with `data-testid="empty-state"` is present.
- `data-testid="task-count"` holds the number of rows shown, as digits only.
- `?show=open` shows only tasks that are not done, `?show=done` only done tasks, and `?show=all` (the default) every
  task. Any other value of `show` is treated as `all`.
- A create form: `<form data-testid="create-form" method="post" action="/ui/tasks">` with a text input
  `data-testid="create-title"` named `title`, and a button `data-testid="create-submit"`.

**Create, `POST /ui/tasks`** (form encoded)

- A valid title (1 to 120 characters after trimming) creates the task and answers `303` with a `Location` that ends
  in `/ui/tasks`.
- An invalid title answers `400` with the list page and an element `data-testid="form-error"` that has a message.
  No task is created.

**Edit page, `GET /ui/tasks/:id/edit`** (`200`, `text/html`, or `404` for an unknown id)

- `<form data-testid="edit-form" method="post" action="/ui/tasks/<id>">` with a text input
  `data-testid="edit-title"` named `title` whose `value` is the current title, a checkbox `data-testid="edit-done"`
  named `done` (value `on`) that is `checked` when the task is done, and a button `data-testid="edit-submit"`.

**Save, `POST /ui/tasks/:id`** (form encoded)

- A valid title saves the title and the done state (a checkbox that is not sent means not done) and answers `303`
  with a `Location` that ends in `/ui/tasks`. An unknown id is `404`.
- An invalid title answers `400` with the edit page, a `data-testid="form-error"` message, and the text the user
  typed still in `edit-title`. Nothing is saved.

Write the `data-testid` attribute with double quotes. Every title shown in a page is HTML-escaped. The JSON API and the pages show the same items. Change only what the
feature needs. The existing behaviour must keep working.
