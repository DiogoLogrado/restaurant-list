import {
  StyleSheet,
  Image,
  TouchableHighlight,
  FlatList,
  ActivityIndicator,
  View,
  Text,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import { useEffect, useState } from "react";
import Modal from "react-native-modal";
/* import { MMKV } from "react-native-mmkv";
export const storage = new MMKV(); */
/* import { MMKVLoader, useMMKVStorage } from "react-native-mmkv-storage";
const storage = new MMKVLoader().initialize(); */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { favoritesEvent } from "./../../utils/EventEmitter";

type Restaurant = {
  id: string;
  name: string;
  image?: string;
  address?: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contacts?: {
    phoneNumber?: string;
    email?: string;
  };
  cuisines?: string[];
};

type Address = {
  address: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
};

type Contacts = {
  phoneNumber: string;
  email: string;
};

interface Cuisine {
  _id: string;
  name: {
    en: string;
  };
  tag: string;
}

type ModalDetails = {
  id: string;
  image_uri: string;
  name: string;
  address: Address;
  contacts: Contacts;
  cuisines: Cuisine[];
};

export default function Restaurant() {
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const colorScheme = useColorScheme();
  const [restaurantList, setRestaurantList] = useState<Restaurant[]>([]);
  const [restaurantResults, setRestaurantResults] = useState({
    totalEntries: 0,
    currentOffset: 0,
    currentLimit: 10,
    hasNextPage: true,
  });
  const defaultFavorites = [
    "66204cb3b58e8d722a01c5c6",
    "66be0526d2d4ee7b7c0776a1",
  ];
  const [favoriteIDList, setFavoriteIDList] = useState<string[]>([]);
  const [modalVisible, setModalVisibility] = useState(false);
  const [modalDetails, setModalDetails] = useState<ModalDetails>({
    id: "",
    image_uri: "",
    name: "",
    address: {
      address: "",
      city: "",
      postalCode: "",
      state: "",
      country: "",
    },
    contacts: {
      phoneNumber: "",
      email: "",
    },
    cuisines: [],
  });

  async function checkFavorites() {
    try {
      const favoritesExist = await AsyncStorage.getItem("favorites");
      if (favoritesExist === null) {
        await AsyncStorage.setItem(
          "favorites",
          JSON.stringify(defaultFavorites)
        );
        setFavoriteIDList(defaultFavorites);
      } else {
        const parsedJSONdata = JSON.parse(favoritesExist);
        const validFavorites = parsedJSONdata.filter(
          (id: any) => id !== null && id !== undefined && id.trim() !== ""
        );
        await AsyncStorage.setItem("favorites", JSON.stringify(validFavorites));
        setFavoriteIDList(validFavorites);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleFavorites(item_id: any) {
    let updatedFavorites;
    if (favoriteIDList?.includes(item_id)) {
      updatedFavorites = favoriteIDList.filter((id) => id !== item_id);
      //setFavoriteIDList(updatedFavorites);
    } else {
      updatedFavorites = [...favoriteIDList, item_id];
      //setFavoriteIDList(updatedFavorites);
    }
    await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  }

  useEffect(() => {
    fetch(
      `https://api.wefood.dev/restaurants?offset=${restaurantResults.currentOffset}&limit=${restaurantResults.currentLimit}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((result) => {
        //List
        const formattedData =
          result?.docs?.map((item: any) => ({
            id: item?._id,
            name: item?.name || "N/A",
            image: item?.image?.url,
            address: item?.addressInfo,
            contacts: item?.contacts,
            cuisines: item?.cuisines,
          })) || [];

        setRestaurantList(formattedData);

        //next pages
        if (result?.hasNextPage)
          setRestaurantResults((prevState) => ({
            ...prevState,
            hasNextPage: true,
          }));
        else
          setRestaurantResults((prevState) => ({
            ...prevState,
            hasNextPage: false,
          }));
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    //Favorites
    checkFavorites();

    favoritesEvent.on("favoritesUpdated", checkFavorites);
    return () => {
      favoritesEvent.off("favoritesUpdated", checkFavorites);
    };
  }, []);

  async function loadMoreRestaurants() {
    if (restaurantResults.hasNextPage) {
      fetch(
        `https://api.wefood.dev/restaurants?offset=${
          restaurantResults.currentOffset + 10
        }&limit=${restaurantResults.currentLimit}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((result) => {
          //List
          const formattedData =
            result?.docs?.map((item: any) => ({
              id: item?._id,
              name: item?.name || "N/A",
              image: item?.image?.url,
              address: item?.addressInfo,
              contacts: item?.contacts,
              cuisines: item?.cuisines,
            })) || [];

          setRestaurantList((prevList) => [...prevList, ...formattedData]);

          //next pages
          if (result?.hasNextPage)
            setRestaurantResults((prevState) => ({
              ...prevState,
              currentOffset: prevState.currentOffset + 10,
              hasNextPage: true,
            }));
          else
            setRestaurantResults((prevState) => ({
              ...prevState,
              currentOffset: prevState.currentOffset + 10,
              hasNextPage: false,
            }));
          setLoadingResults(false);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  function renderFavorite(item_id: any) {
    return (
      <TouchableOpacity
        onPress={() => {
          handleFavorites(item_id);
          favoritesEvent.emit("favoritesUpdated");
        }}
        style={styles.favoriteButton}
      >
        <IconSymbol
          size={28}
          name={favoriteIDList?.includes(item_id) ? "heart.fill" : "heart"}
          color={"black"}
        />
      </TouchableOpacity>
    );
  }

  function renderRestaurantItem(item: any) {
    return (
      <TouchableHighlight
        underlayColor={"transparent"}
        onPress={() => {
          setModalDetails({
            id: item?.id,
            image_uri: item?.image,
            name: item?.name,
            address: item?.address,
            contacts: item?.contacts,
            cuisines: item?.cuisines,
          });
          setModalVisibility(true);
        }}
      >
        <View style={styles.flatListItem}>
          <Image
            source={
              item.image
                ? { uri: item?.image }
                : require("./../../assets/images/restaurant.png")
            }
            style={styles.flatListItemImage}
          />

          <Text numberOfLines={2} style={styles.flatListItemText}>
            {item?.name}
          </Text>
          {renderFavorite(item?.id)}
        </View>
      </TouchableHighlight>
    );
  }

  function renderModalDetails() {
    return (
      <Modal
        isVisible={modalVisible}
        animationIn={"fadeIn"}
        animationOut={"fadeOut"}
        onBackButtonPress={() => setModalVisibility(false)}
      >
        <View style={styles.modal}>
          {/* Thumbnail */}
          <Image
            source={
              modalDetails.image_uri
                ? { uri: modalDetails.image_uri }
                : require("./../../assets/images/restaurant.png")
            }
            style={styles.modalImage}
          />
          {/* Name */}
          <View style={styles.modalView}>
            <IconSymbol
              style={styles.modalIcons}
              size={17}
              name="house.fill"
              color={"black"}
            />
            <Text>{modalDetails.name}</Text>
          </View>
          {/* Location */}
          <View style={styles.modalView}>
            <IconSymbol
              style={styles.modalIcons}
              size={17}
              name="location"
              color={"black"}
            />
            <Text style={{ flexWrap: "wrap", wordWrap: "wrap" }}>
              {modalDetails?.address?.address}
            </Text>
          </View>
          {/* Contacts */}
          <View style={styles.modalView}>
            <IconSymbol
              style={styles.modalIcons}
              size={17}
              name="contact.sensor"
              color={"black"}
            />
            <Text style={{ flexWrap: "wrap" }}>
              {`${modalDetails?.contacts?.phoneNumber} / ${modalDetails?.contacts?.email}`}
            </Text>
          </View>
          {/* Type of food */}
          <View style={styles.modalView}>
            <IconSymbol
              style={styles.modalIcons}
              size={17}
              name="a"
              color={"black"}
            />
            <Text style={{ flexWrap: "wrap" }}>
              {modalDetails?.cuisines && modalDetails.cuisines.length > 0
                ? modalDetails?.cuisines
                    .map((cuisine) => cuisine.name.en)
                    .join(", ")
                : "Not provided"}
            </Text>
          </View>
          {/* Go back */}
          <TouchableHighlight
            activeOpacity={0.5}
            underlayColor={"000"}
            onPress={() => setModalVisibility(false)}
            style={styles.closeButton}
          >
            <IconSymbol size={28} name="arrow.left" color={"black"} />
          </TouchableHighlight>
          {/* Favorite */}
          <TouchableHighlight
            activeOpacity={0.5}
            underlayColor={"000"}
            onPress={() => {
              handleFavorites(modalDetails.id);
              favoritesEvent.emit("favoritesUpdated");
            }}
            style={styles.modalFavoriteButton}
          >
            <IconSymbol
              size={28}
              name={
                favoriteIDList?.includes(modalDetails.id)
                  ? "heart.fill"
                  : "heart"
              }
              color={"black"}
            />
          </TouchableHighlight>
        </View>
      </Modal>
    );
  }

  function renderEndOfList() {
    if (!restaurantResults.hasNextPage)
      return (
        <View
          style={{
            width: "100%",
          }}
        >
          <Text
            style={{
              color: colorScheme === "dark" ? "#A8B0B3" : "#9E9E9E",
              textAlign: "center",
            }}
          >
            End of list
          </Text>
        </View>
      );
    if (restaurantResults.hasNextPage && !loadingResults)
      return (
        <View
          style={{
            width: "100%",
          }}
        >
          <Text
            style={{
              color: colorScheme === "dark" ? "#A8B0B3" : "#9E9E9E",
              textAlign: "center",
            }}
          >
            ...
          </Text>
        </View>
      );
    if (loadingResults)
      return (
        <View
          style={{
            width: "100%",
          }}
        >
          <ActivityIndicator
            size="small"
            color={colorScheme === "dark" ? "#A8B0B3" : "#9E9E9E"}
          />
          <Text
            style={{
              color: colorScheme === "dark" ? "#A8B0B3" : "#9E9E9E",
              textAlign: "center",
            }}
          >
            Loading more restaurants...
          </Text>
        </View>
      );
  }

  if (loading) {
    return (
      <View style={styles.containerLoad}>
        <ActivityIndicator size="large" color="grey" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.flatList}
        data={restaurantList}
        renderItem={({ item }) => renderRestaurantItem(item)}
        keyExtractor={(item) => item.id}
        ListFooterComponent={renderEndOfList}
        onEndReached={() => {
          setLoadingResults(true);
          loadMoreRestaurants();
        }} //
      />
      <View style={{ flex: 1 }}>{renderModalDetails()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerLoad: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
  },
  flatList: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
    width: "90%",
    maxWidth: 1140,
    alignSelf: "center",
    gap: 10,
  },
  modal: {
    backgroundColor: "rgba(255, 255, 255,0.99)",
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  modalView: {
    flexDirection: "row",
    paddingHorizontal: 5,
    paddingVertical: 6,
    gap: 5,
    paddingLeft: 10,
    paddingRight: 20,
  },
  flatListItem: {
    height: 110,
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "lightgrey",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  flatListItemText: {
    height: "90%",
    width: "60%",
    alignSelf: "flex-start",
    paddingTop: 2,
    fontSize: 19,
  },
  flatListItemImage: {
    height: "90%",
    width: 90,
    borderWidth: 1,
    borderColor: "lightgrey",
    resizeMode: "cover",
    borderRadius: 5,
  },
  flatListItemImageDefault: {
    height: "90%",
    width: 90,
    borderWidth: 1,
    borderColor: "lightgrey",
    resizeMode: "cover",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    height: "30%",
    width: "100%",
    resizeMode: "cover" /* Platform.OS === "web" ? "cover" : "contain", */,
    opacity: 0.9,
  },
  modalIcons: {
    /* height: 15,
    width: 15, */
    top: 2,
  },
  modalRestaurantName: {
    fontSize: 19,
  },
  favoriteButton: {
    position: "absolute",
    right: 20,
  },
  closeButton: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: "white",
    borderRadius: "50%",
    padding: 5,
  },
  modalFavoriteButton: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "white",
    borderRadius: "50%",
    padding: 5,
  },
});
