## /start

> Actions:
> /add, /remove, /list

## /add

### addTaskAskName

> 💬 Name?
> 💡 type /abort to abort
Example Task

> ✅ Name: <b>${name}</b>
> <b>${name}</b> shouldn't be empty!

### addTaskAskUrl


> 💬 URL?
> 💡 type /abort to abort
https://google.com

> ✅ URL: <code>https://google.com</code>
> 🚫 <code>https://google.com</code> should be a valid URL!

### addTaskAskTarget

> 💬 Target? \[<b><u>Selector</u></b>\] → [Match String (optional)]
> 💡 type /targetend to finish

### addTaskAskTargetMatchString

> 💬 Target? [Selector] → <b><u>[Match String (optional)]</u></b>
> 💡 type /targetskipmatchstring to skip
> 💡 type /targetend to finish

> 🚫 Must have at least 1 target.

> ✅ Target:
> <b>#1</b>
> └ Selector: <code>div > span</code>

> <b>#2</b>
> ├ Selector: <code>*</code>
> └ Target: <code>会社概要</code>

### addTaskAskInterval

> 💬 Interval? (in ms)
> 💡 type /abort to abort

5000

> ✅ Interval: <b>${interval}</b>
> 🚫 <b>${interval}</b> should be a valid number >= 5000!

### addTaskReview
> ✅ Name: <b>${name}</b>
> ✅ URL: <pre>https://google.com</pre>
> ...
>
> 💬 Confirm to add? /yes /no
> 💡 type /abort to abort
