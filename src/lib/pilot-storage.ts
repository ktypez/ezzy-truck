const STORAGE_KEY = 'pilot-logs'

function getLogs(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLogs(logs: any[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

class QueryBuilder {
  private _table: string
  private _filters: { column: string; value: any; op: string }[] = []
  private _single = false
  private _order?: { column: string; ascending: boolean }
  private _select = '*'

  constructor(table: string) {
    this._table = table
  }

  select(cols: string) {
    this._select = cols
    return this
  }

  eq(col: string, val: any) {
    this._filters.push({ column: col, value: val, op: 'eq' })
    return this
  }

  not(col: string, op: string, val: any) {
    this._filters.push({ column: col, value: val, op: 'not_null' })
    return this
  }

  order(col: string, opts: { ascending: boolean }) {
    this._order = { column: col, ascending: opts.ascending }
    return this
  }

  maybeSingle() {
    this._single = true
    return this
  }

  then(resolve: (val: { data: any | null; error: null }) => void, reject?: (err: any) => void) {
    try {
      let logs = getLogs().filter((r) => r._table === this._table)

      for (const f of this._filters) {
        if (f.op === 'eq') {
          logs = logs.filter((r) => r[f.column] === f.value)
        } else if (f.op === 'not_null') {
          logs = logs.filter((r) => r[f.column] != null)
        }
      }

      if (this._order) {
        const { column, ascending } = this._order
        logs.sort((a, b) =>
          ascending ? (a[column] > b[column] ? 1 : -1) : a[column] < b[column] ? 1 : -1
        )
      }

      const result = this._single ? { data: logs[0] || null, error: null } : { data: logs, error: null }
      resolve(result)
    } catch (err) {
      if (reject) reject(err)
    }
  }
}

function upsert(table: string, payload: any, options?: { onConflict?: string }) {
  const logs = getLogs()

  if (options?.onConflict) {
    const keys = options.onConflict.split(',').map((k) => k.trim())
    const idx = logs.findIndex(
      (r) => r._table === table && keys.every((k) => r[k] === payload[k])
    )
    if (idx >= 0) {
      logs[idx] = { ...logs[idx], ...payload }
    } else {
      logs.push({ ...payload, _table: table })
    }
  } else {
    logs.push({ ...payload, _table: table })
  }

  saveLogs(logs)
  return { data: null, error: null }
}

export const pilotStorage = {
  from(table: string) {
    return {
      select(cols: string) {
        return new QueryBuilder(table).select(cols)
      },
      upsert(payload: any, options?: { onConflict?: string }) {
        return upsert(table, payload, options)
      },
    }
  },
}
