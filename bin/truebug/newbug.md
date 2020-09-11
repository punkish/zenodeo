# newbug

Can run automatically (periodidically) or on demand.

## Automatically

1. Wake up every `t` seconds
2. Check last run data
3. If never run before, start a fresh run
4. If run before, do a diff run
5. Clean up
6. On end, store run data

## On demand

When running on demand, can run unattended or using a custom menu

### On demand unattended

1. Check last run data
2. If never run before, start a fresh run
3. If run before, do a diff run
4. Clean up
5. On end, store run data

### On demand custom

Custom menu 

--download  false | [ full | diff | <guid> ]
--rearrange false | true
--database  false | true
--parse     false | all | n = number of treatments to parse | treatment_id

```js
const lastRun = function() {
    const sql = 'SELECT * FROM newbug'
}
```