import { getI18nText } from '../languages';

/* For Delayed Event Handler Execution */
export function debounce(fn, delay) {
  let timeoutID = null;
  return (...args) => {
    clearTimeout(timeoutID);
    const that = this;
    timeoutID = setTimeout(() => {
      fn.apply(that, args);
    }, delay);
  };
}

export const invalidCharsRegEx = new RegExp(/[\s#:?&={}]/, 'g'); // used for generating valid html element ids by replacing the invalid chars with hyphen (-)

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function copyToClipboard(copyData, eventTarget) {
  let data = copyData?.trim().replace(/\s{8}/g, '  ');
  try {
    // Convert to 2 spaces in all JSON text
    data = JSON.stringify(JSON.parse(data), null, 2).trim();
  } catch (error) {
    // Ignore non JSON text;
  }

  const textArea = document.createElement('textarea');
  textArea.value = data;
  textArea.style.position = 'fixed'; // avoid scrolling to bottom
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    const btnEl = eventTarget?.target;
    if (btnEl) {
      btnEl.innerText = getI18nText('operations.copied');
      setTimeout(() => {
        btnEl.innerText = getI18nText('operations.copy');
      }, 5000);
    }
  } catch (err) {
    console.error('Unable to copy', err); // eslint-disable-line no-console
  }
  document.body.removeChild(textArea);
}

export function getBaseUrlFromUrl(url) {
  const pathArray = url.split('/');
  return `${pathArray[0]}//${pathArray[2]}`;
}

export function componentIsInSearch(searchVal, component) {
  return !searchVal || component.name.toLowerCase().includes(searchVal.toLowerCase());
}

export function pathIsInSearch(searchVal, path) {
  if (!searchVal) {
    return true;
  }
  const stringToSearch = `${path.method} ${path.path} ${path.summary || path.description || ''} ${path.operationId || ''}`.toLowerCase();
  return stringToSearch.includes(searchVal.toLowerCase());
}

export function schemaKeys(schemaProps, result = new Set()) {
  if (!schemaProps) {
    return result;
  }
  Object.keys(schemaProps).forEach((key) => {
    result.add(key);
    if (schemaProps[key].properties) {
      schemaKeys(schemaProps[key].properties, result);
    } else if (schemaProps[key].items && schemaProps[key].items.properties) {
      schemaKeys(schemaProps[key].items.properties, result);
    }
  });
  return result;
}

export function advancedSearch(searchVal, allSpecTags, searchOptions = []) {
  if (!searchVal.trim() || searchOptions.length === 0) {
    return undefined;
  }

  const pathsMatched = [];
  allSpecTags.forEach((tag) => {
    tag.paths.forEach((path) => {
      let stringToSearch = '';
      if (searchOptions.includes('search-api-path')) {
        stringToSearch = path.path;
      }
      if (searchOptions.includes('search-api-descr')) {
        stringToSearch = `${stringToSearch} ${path.summary || path.description || ''}`;
      }
      if (searchOptions.includes('search-api-params')) {
        stringToSearch = `${stringToSearch} ${path.parameters && path.parameters.map((v) => v.name).join(' ') || ''}`;
      }

      if (searchOptions.includes('search-api-request-body') && path.requestBody) {
        let schemaKeySet = new Set();
        for (const contentType in path.requestBody && path.requestBody.content) {
          if (path.requestBody.content[contentType].schema && path.requestBody.content[contentType].schema.properties) {
            schemaKeySet = schemaKeys(path.requestBody.content[contentType].schema.properties);
          }
          stringToSearch = `${stringToSearch} ${[...schemaKeySet].join(' ')}`;
        }
      }

      if (searchOptions.includes('search-api-resp-descr')) {
        stringToSearch = `${stringToSearch} ${Object.values(path.responses).map((v) => v.description || '').join(' ')}`;
      }

      if (stringToSearch.toLowerCase().includes(searchVal.trim().toLowerCase())) {
        pathsMatched.push({
          elementId: path.elementId,
          method: path.method,
          path: path.path,
          summary: path.summary || path.description || '',
          deprecated: path.deprecated,
        });
      }
    });
  });
  return pathsMatched;
}

export function getCurrentElement() {
  const currentQuery = (window.location.hash || '').split('?')[1];
  const query = new URLSearchParams(currentQuery);
  return decodeURIComponent(query.get('route') || '');
}

export function replaceState(rawElementId) {
  const elementId = rawElementId && rawElementId.replace(/^#/, '') || '';

  const currentNavigationHashPart = (window.location.hash || '').split('?')[0].replace(/^#/, '');
  const currentQuery = (window.location.hash || '').split('?')[1];
  const query = new URLSearchParams(currentQuery);
  query.delete('route');
  const newQuery = query.toString().length > 1 ? `${query.toString()}&route=${elementId}` : `route=${elementId}`;
  window.history.replaceState(null, null, `#${currentNavigationHashPart}?${newQuery}`);
}
