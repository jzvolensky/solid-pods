import requests
import math

# URL of the GeoJSON data
geojson_url = "https://jzvolensky.solidcommunity.net/Spatial%20data%20testing/LocationFiles/GeoJSON_locations.geojson"

def haversine_distance(coord1, coord2):
    # Coordinates are in [longitude, latitude] format
    lon1, lat1 = coord1
    lon2, lat2 = coord2

    # Radius of the Earth in meters
    earth_radius = 6371000  # meters

    # Convert latitude and longitude from degrees to radians
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)

    # Haversine formula
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = earth_radius * c

    return distance

def get_nearby_points(geojson_url, reference_coordinates, max_distance):
    try:
        response = requests.get(geojson_url)
        response.raise_for_status()  # Check for HTTP errors
        geojson_data = response.json()

        nearby_points = []

        if "features" in geojson_data:
            for feature in geojson_data["features"]:
                point_coordinates = feature["geometry"]["coordinates"]
                distance = haversine_distance(reference_coordinates, point_coordinates)
                
                if distance <= max_distance:
                    point_name = feature["properties"]["name"]
                    nearby_points.append({
                        "name": point_name,
                        "coordinates": point_coordinates,
                        "distance": distance
                    })

            return nearby_points
        else:
            return None
    except requests.exceptions.RequestException as e:
        print("Error:", e)
        return None

# Index of the reference point (0-based index)
reference_point_index = 2  # Point 3

# Maximum distance in meters
max_distance = 600

# Fetch the reference point's coordinates
response = requests.get(geojson_url)
geojson_data = response.json()

if "features" in geojson_data and len(geojson_data["features"]) > reference_point_index:
    reference_coordinates = geojson_data["features"][reference_point_index]["geometry"]["coordinates"]
    nearby_points = get_nearby_points(geojson_url, reference_coordinates, max_distance)
    
    if nearby_points:
        print(f"Points within {max_distance} meters from Point {reference_point_index + 1}:")
        for point in nearby_points:
            print(f"Name: {point['name']}, Coordinates: {point['coordinates']}, Distance: {point['distance']} meters")
    else:
        print(f"No points found within {max_distance} meters.")
else:
    print("Reference point not found or coordinates unavailable.")