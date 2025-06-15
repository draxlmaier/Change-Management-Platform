import * as XLSX from "xlsx";
import { IPublicClientApplication } from "@azure/msal-browser";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export async function findListIdByName(
  siteId: string,
  listName: string,
  token: string
): Promise<string | null> {
  const url = `${GRAPH_BASE}/sites/${siteId}/lists?$filter=displayName eq '${listName}'`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (resp.ok) {
    const data = await resp.json();
    return data?.value?.[0]?.id || null;
  }
  console.error("[LIST_FIND_FAIL]", await resp.text());
  return null;
}

export async function getAccessToken(msalInstance: IPublicClientApplication): Promise<string | null> {
  const accounts = msalInstance.getAllAccounts();
  if (!accounts.length) return null;
  const response = await msalInstance.acquireTokenSilent({
    account: accounts[0],
    scopes: ["https://graph.microsoft.com/.default"]
  });
  return response.accessToken;
}

export async function createSpList(
  siteId: string,
  listName: string,
  token: string
): Promise<string | null> {
  const url = `${GRAPH_BASE}/sites/${siteId}/lists`;
  const body = {
    displayName: listName,
    list: { template: "genericList" }
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (resp.ok) {
    const data = await resp.json();
    return data.id;
  }
  console.error("[LIST_CREATE_FAIL]", await resp.text());
  return null;
}

export async function getAllListItems(
  siteId: string,
  listId: string,
  token: string
): Promise<any[]> {
  let items: any[] = [];
  let next = `${GRAPH_BASE}/sites/${siteId}/lists/${listId}/items`;
  while (next) {
    const resp = await fetch(next, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) {
      console.error("[GET_ALL_ITEMS_FAIL]", await resp.text());
      break;
    }
    const json = await resp.json();
    items = items.concat(json.value);
    next = json["@odata.nextLink"];
  }
  return items;
}

export async function deleteAllItems(
  siteId: string,
  listId: string,
  token: string
): Promise<void> {
  const items = await getAllListItems(siteId, listId, token);
  for (const item of items) {
    const delUrl = `${GRAPH_BASE}/sites/${siteId}/lists/${listId}/items/${item.id}`;
    await fetch(delUrl, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  console.log(`[CLEARED_LIST] => ${items.length} items deleted`);
}

export async function getExistingColumns(
  siteId: string,
  listId: string,
  token: string
): Promise<Record<string, string>> {
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/columns`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const out: Record<string, string> = {};
  if (resp.ok) {
    const data = await resp.json();
    for (const col of data.value) {
      out[col.displayName] = col.name;
    }
  } else {
    console.error("[GET_COLUMNS_FAIL]", await resp.text());
  }
  return out;
}

export async function createTextColumn(
  siteId: string,
  listId: string,
  displayName: string,
  token: string
): Promise<string | null> {
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/columns`;
  const body = {
    name: displayName,
    displayName: displayName,
    text: {}
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (resp.ok) {
    const data = await resp.json();
    console.log(`[TEXT_COLUMN_CREATED] '${displayName}' => InternalName: ${data.name}`);
    return data.name;
  } else {
    console.error(`[TEXT_COLUMN_FAIL] '${displayName}' =>`, await resp.text());
    return null;
  }
}

export async function createTextColumnWithRetry(
  siteId: string,
  listId: string,
  displayName: string,
  token: string,
  maxRetries = 3
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const name = await createTextColumn(siteId, listId, displayName, token);
    if (name) return name;

    console.warn(`[RETRY ${attempt}/${maxRetries}] Failed to create column '${displayName}'. Retrying...`);
    await new Promise(res => setTimeout(res, 2000));
  }
  console.error(`[GIVE UP] Could not create column '${displayName}'`);
  return null;
}

export async function insertItem(
  siteId: string,
  listId: string,
  fieldsMap: Record<string, string>,
  token: string,
  rowNum = 0
): Promise<string | null> {
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`;
  const body = { fields: { Title: `Row_${rowNum}`, ...fieldsMap } };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (resp.ok) {
    const js = await resp.json();
    console.log(`[ITEM_CREATED] ID: ${js.id}`);
    return js.id;
  } else {
    console.error(`[ITEM_CREATE_FAIL]`, await resp.text());
    return null;
  }
}

export async function processDataframe(
  df: any,
  projectName: string,
  phase: string,
  siteId: string,
  token: string
): Promise<void> {
  const listName = `changes_${projectName.trim()}_${phase.trim()}`;
  console.log(`[UPLOAD_START] To SharePoint List: '${listName}'`);

  let listId = await findListIdByName(siteId, listName, token);
  if (!listId) {
    listId = await createSpList(siteId, listName, token);
    if (!listId) return console.error(`[ERROR] Failed to create list ${listName}`);
    console.log(`[NEW LIST CREATED] ${listName}`);
  } else {
    console.log(`[EXISTING LIST FOUND] ${listName}`);
    await deleteAllItems(siteId, listId, token);
  }

  const existingCols = await getExistingColumns(siteId, listId, token);
  const finalCols: string[] = [];

  for (const col of df.columns) {
    if (existingCols[col]) {
      finalCols.push(col);
    } else {
      const internal = await createTextColumnWithRetry(siteId, listId, col, token);
      if (internal) finalCols.push(col);
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(df);
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  let inserted = 0;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i] as Record<string, any>;
    const fieldsMap: Record<string, string> = {};
    for (const col of finalCols) {
      let val = row[col];
      if (val === undefined || val === null || val === "---") val = "";
      fieldsMap[col] = String(val);
    }
    const id = await insertItem(siteId, listId, fieldsMap, token, i + 1);
    if (id) inserted++;
  }

  console.log(`[DONE] Inserted ${inserted}/${jsonData.length} rows into '${listName}'`);
}

export async function resolveSiteIdFromUrl(
  siteUrl: string,
  token: string
): Promise<{ siteId: string | null, isPersonal: boolean }> {
  try {
    const parsedUrl = new URL(siteUrl);
    const hostname = parsedUrl.hostname;
    let path = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");

    let graphUrl = "";
    let isPersonal = false;

    if (path.startsWith("sites/")) {
      path = path.replace(/^sites\//, "");
      graphUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${path}`;
    } else if (path.startsWith("personal/")) {
      path = path.replace(/^personal\//, "");
      graphUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/personal/${path}`;
      isPersonal = true;
    } else {
      console.error(`[SITE_ID_FAIL] Unsupported URL format: ${siteUrl}`);
      return { siteId: null, isPersonal: false };
    }

    const resp = await fetch(graphUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (resp.ok) {
      const data = await resp.json();
      console.log(`[SITE_ID_RESOLVED] => ${data.id}`);
      return { siteId: data.id, isPersonal };
    } else {
      console.error("[SITE_ID_FAIL]", await resp.text());
      return { siteId: null, isPersonal: false };
    }
  } catch (err: any) {
    console.error("[SITE_ID_FAIL]", err.message);
    return { siteId: null, isPersonal: false };
  }
}

