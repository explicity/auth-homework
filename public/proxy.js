let api = [];

// proxy pattern for fetchcing data from server
const networkFetch = async jwt => {
  const response = await fetch("/race/api", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`
    }
  });
  const json = await response.json();
  api.push(json.text);
  return json.text;
};

const cache = [];
const proxiedNetworkFetch = new Proxy(networkFetch, {
  apply(target, thisArg, args) {
    const urlParam = args[0];
    // if it's already in cache, take the results from cache
    if (cache.includes(urlParam)) {
      return api;
    } else {
      cache.push(urlParam);
      return Reflect.apply(target, thisArg, args);
    }
  }
});

export { proxiedNetworkFetch };
