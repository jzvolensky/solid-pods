import geopandas as gpd
import folium

data = gpd.read_file('https://jzvolensky.solidcommunity.net/public/LocationFiles/GeoJSON_locations.geojson')
print(data.describe())

m = folium.Map(location=[data.geometry.y.iloc[0], data.geometry.x.iloc[0]], zoom_start=10)
for idx, row in data.iterrows():
    folium.Marker([row['geometry'].y, row['geometry'].x], popup=row['name']).add_to(m)

m.save('map.html')