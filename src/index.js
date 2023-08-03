// Import from "@inrupt/solid-client-authn-browser"
import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  fetch
} from "@inrupt/solid-client-authn-browser";

// Import from "@inrupt/solid-client"
import {
  addUrl,
  addStringNoLocale,
  createSolidDataset,
  createThing,
  getPodUrlAll,
  getSolidDataset,
  getThingAll,
  getStringNoLocale,
  removeThing,
  saveSolidDatasetAt,
  setThing
} from "@inrupt/solid-client";

import { SCHEMA_INRUPT, RDF, AS } from "@inrupt/vocab-common-rdf";


const selectorIdP = document.querySelector("#select-idp");
const selectorPod = document.querySelector("#select-pod");
const buttonLogin = document.querySelector("#btnLogin");
const buttonRead = document.querySelector("#btnRead");
const buttonCreate = document.querySelector("#btnCreate");
const buttonDownload = document.querySelector("#buttonDownload");
const buttonUpload = document.querySelector('#buttonUpload')
const labelCreateStatus = document.querySelector("#labelCreateStatus");
const buttonAddPoint = document.querySelector("#buttonAddPoint")

buttonRead.setAttribute("disabled", "disabled");
buttonLogin.setAttribute("disabled", "disabled");
buttonCreate.setAttribute("disabled", "disabled");

// 1a. Start Login Process. Call login() function.
function loginToSelectedIdP() {
  const SELECTED_IDP = document.getElementById("select-idp").value;

  return login({
    oidcIssuer: SELECTED_IDP,
    redirectUrl: new URL("/", window.location.href).toString(),
    clientName: "Getting started app"
  });
}

// 1b. Login Redirect. Call handleIncomingRedirect() function.
// When redirected after login, finish the process by retrieving session information.
async function handleRedirectAfterLogin() {
  await handleIncomingRedirect(); // no-op if not part of login redirect

  const session = getDefaultSession();
  if (session.info.isLoggedIn) {
    // Update the page with the status.
    document.getElementById("myWebID").value = session.info.webId;

    // Enable Read button to read Pod URL
    buttonRead.removeAttribute("disabled");
  }
}

// The example has the login redirect back to the root page.
// The page calls this method, which, in turn, calls handleIncomingRedirect.
handleRedirectAfterLogin();

// 2. Get Pod(s) associated with the WebID
async function getMyPods() {
  const webID = document.getElementById("myWebID").value;
  const mypods = await getPodUrlAll(webID, { fetch: fetch });

  // Update the page with the retrieved values.

  mypods.forEach((mypod) => {
    let podOption = document.createElement("option");
    podOption.textContent = mypod;
    podOption.value = mypod;
    selectorPod.appendChild(podOption);
  });
}

//The following async function handles the upload of non structured data
// i.e files to a Solid Pod
async function handleFileUpload() {
  const fileInput = document.getElementById("file-input");
  const uploadStatus = document.getElementById("uploadStatus");

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const SELECTED_POD = document.getElementById("select-pod").value;

    // Construct the file URL on the Solid Pod
    const fileUrl = `${SELECTED_POD}public/LocationFiles/${encodeURIComponent(file.name)}`;

    try {
      // Determine the appropriate Content-Type based on the file type
      const contentType = file.type || "application/octet-stream"; // "application/octet-stream" is a fallback if the file type is unknown

      // Create headers for the Fetch API request
      const headers = new Headers();
      headers.append("Content-Type", contentType);

      // Upload the file to the Solid Pod
      const response = await fetch(fileUrl, {
        method: "PUT",
        body: file,
        headers: headers,
      });

      if (response.ok) {
        console.log("File uploaded successfully!");

        // Update the upload status text
        uploadStatus.textContent = `File "${file.name}" uploaded successfully.`;
      } else {
        console.error("Error uploading file:", response.status);

        // Update the upload status text
        uploadStatus.textContent = `Error uploading file "${file.name}": ${response.status}.`;
      }
    } catch (error) {
      console.error("Error uploading file:", error.message);

      // Update the upload status text
      uploadStatus.textContent = `Error uploading file "${file.name}": ${error.message}`;
    }
  }
}
  
async function addNewPoint() {
  const newPointCoords = "5.178000 52.084742"; // Replace with the coordinates of your new point

  // GML data for the new point
  const newPointGML = `
    <gml:featureMember>
      <gml:Point>
        <gml:pos>${newPointCoords}</gml:pos>
      </gml:Point>
    </gml:featureMember>
  `;

  // Fetch API POST request
  fetch('https://jzvolensky.solidcommunity.net/public/LocationFiles/GML_locations.gml', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream', // Set the appropriate content type for GML data
    },
    body: `
      <?xml version="1.0" encoding="UTF-8"?>
      <gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/gml http://schemas.opengis.net/gml/3.1.1/base/gml.xsd">
        ${newPointGML}
      </gml:FeatureCollection>
    `,
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    console.log('Point added successfully:', data);
    // Perform any additional actions here if needed
  })
  .catch(error => {
    console.error('Error adding point:', error);
  });
}







// 3. Create the Reading List
async function createList() {
  labelCreateStatus.textContent = "";
  const SELECTED_POD = document.getElementById("select-pod").value;

  // For simplicity and brevity, this tutorial hardcodes the  SolidDataset URL.
  // In practice, you should add in your profile a link to this resource
  // such that applications can follow to find your list.
  const readingListUrl = `${SELECTED_POD}getting-started/readingList/myList`;

  let titles = document.getElementById("titles").value.split("\n");

  // Fetch or create a new reading list.
  let myReadingList;

  try {
    // Attempt to retrieve the reading list in case it already exists.
    myReadingList = await getSolidDataset(readingListUrl, { fetch: fetch });
    // Clear the list to override the whole list
    let items = getThingAll(myReadingList);
    items.forEach((item) => {
      myReadingList = removeThing(myReadingList, item);
    });
  } catch (error) {
    if (typeof error.statusCode === "number" && error.statusCode === 404) {
      // if not found, create a new SolidDataset (i.e., the reading list)
      myReadingList = createSolidDataset();
    } else {
      console.error(error.message);
    }
  }

  // Add titles to the Dataset
  let i = 0;
  titles.forEach((title) => {
    if (title.trim() !== "") {
      let item = createThing({ name: "title" + i });
      item = addUrl(item, RDF.type, AS.Article);
      item = addStringNoLocale(item, SCHEMA_INRUPT.name, title);
      myReadingList = setThing(myReadingList, item);
      i++;
    }
  });

  try {
    // Save the SolidDataset
    let savedReadingList = await saveSolidDatasetAt(
      readingListUrl,
      myReadingList,
      { fetch: fetch }
    );

    labelCreateStatus.textContent = "Saved";
  } catch (error) {
    console.error(error.message);
  }
}

buttonAddPoint.onclick = function () {
  addNewPoint();
}

buttonUpload.onclick = function () {
  handleFileUpload();
};

buttonLogin.onclick = function () {
  loginToSelectedIdP();
};

buttonRead.onclick = function () {
  getMyPods();
};

buttonCreate.onclick = function () {
  createList();
};

selectorIdP.addEventListener("change", idpSelectionHandler);
function idpSelectionHandler() {
  if (selectorIdP.value === "") {
    buttonLogin.setAttribute("disabled", "disabled");
  } else {
    buttonLogin.removeAttribute("disabled");
  }
}

selectorPod.addEventListener("change", podSelectionHandler);
function podSelectionHandler() {
  if (selectorPod.value === "") {
    buttonCreate.setAttribute("disabled", "disabled");
  } else {
    buttonCreate.removeAttribute("disabled");
  }
}