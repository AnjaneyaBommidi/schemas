var favorites = JSON.parse(responseBody);
if (favorites.length > 0) {
  postman.setEnvironmentVariable('my_favorites', favorites);
}
