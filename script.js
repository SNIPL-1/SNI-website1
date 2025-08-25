//const productsCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBzZ-oe22p1secr4Z1JGc105GaDHzH7eJvXIVcHDcNQ2WNYTZKFlwUyQcNjb6XuAvYCvcrovvcnajj/pub?gid=406069211&single=true&output=csv";
//const companyCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBzZ-oe22p1secr4Z1JGc105GaDHzH7eJvXIVcHDcNQ2WNYTZKFlwUyQcNjb6XuAvYCvcrovvcnajj/pub?gid=0&single=true&output=csv";
//const formEndpoint = "https://script.google.com/macros/s/AKfycbwYyQMsjC6y2_cU9LcoD7hpw41ml7-VlFTJBrgKfhkdapEU2fkhUvM3yEdB_KxBf42B/exec";
//https://docs.google.com/spreadsheets/d/e/2PACX-1vTBzZ-oe22p1secr4Z1JGc105GaDHzH7eJvXIVcHDcNQ2WNYTZKFlwUyQcNjb6XuAvYCvcrovvcnajj/pubhtml?gid=406069211&single=true

const ABOUT_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBzZ-oe22p1secr4Z1JGc105GaDHzH7eJvXIVcHDcNQ2WNYTZKFlwUyQcNjb6XuAvYCvcrovvcnajj/pub?gid=0&single=true&output=csv";
const DB_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBzZ-oe22p1secr4Z1JGc105GaDHzH7eJvXIVcHDcNQ2WNYTZKFlwUyQcNjb6XuAvYCvcrovvcnajj/pub?gid=406069211&single=true&output=csv";
const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbwYyQMsjC6y2_cU9LcoD7hpw41ml7-VlFTJBrgKfhkdapEU2fkhUvM3yEdB_KxBf42B/exec";
let dbData = [];
let groupedProducts = {};

// Load About section
document.addEventListener('DOMContentLoaded', () => {
  Papa.parse(ABOUT_URL, {
    download: true,
    header: true,
    complete: (results) => {
      const data = results.data;
      const aboutDiv = document.getElementById('about-content');
      data.forEach(row => {
        if(row.Field === 'Company Name') document.querySelector('.logo').innerText = row.Value;
        if(row.Field === 'About') aboutDiv.innerHTML = `<p>${row.Value}</p>`;
        if(row.Field === 'Contact Email') document.getElementById('contact-email').innerText = row.Value;
        if(row.Field === 'Phone') document.getElementById('contact-phone').innerText = row.Value;
      });
    }
  });

  // Load DB and process products
  Papa.parse(DB_URL, {
    download: true,
    header: true,
    complete: (results) => {
      dbData = results.data;
      groupProductsByItemCode();
      displayCategories();
    }
  });
});

function groupProductsByItemCode() {
  groupedProducts = {};
  dbData.forEach(row => {
    if(!groupedProducts[row['Item Code']]) {
      groupedProducts[row['Item Code']] = {
        category: row['Category'],
        hsn: row['HSN Code'],
        name: row['Item Name'],
        specs: row['Specs'],
        image: row['Image URL'],
        variants: []
      };
    }
    groupedProducts[row['Item Code']].variants.push(row);
  });
}

function displayCategories() {
  const categoriesDiv = document.getElementById('categories');
  const categories = [...new Set(dbData.map(item => item.Category))];
  categoriesDiv.innerHTML = categories.map(cat => `
    <div class="card" onclick="showProducts('${cat}')">${cat}</div>
  `).join('');
}

function showProducts(category) {
  document.getElementById('categories').classList.add('hidden');
  const productsList = document.getElementById('products-list');
  productsList.classList.remove('hidden');

  const items = Object.entries(groupedProducts).filter(([code, data]) => data.category === category);
  productsList.innerHTML = items.map(([code, data]) => `
    <div class="card" onclick="showProductDetail('${code}')">
      <img src="${data.image}" alt="${data.name}" />
      <h3>${data.name}</h3>
      <p>${code}</p>
    </div>
  `).join('');
}

function showProductDetail(code) {
  document.getElementById('products-list').classList.add('hidden');
  const detailDiv = document.getElementById('product-detail');
  detailDiv.classList.remove('hidden');

  const data = groupedProducts[code];
  let variantsRows = data.variants.map(v => {
    const msg = `Hi, I am interested in this product.%0AItem Name: ${data.name}%0AVariant Code: ${v['Variant Code']}%0ADescription: ${v['Description']}%0APrice/Unit: ${v['Price/Unit']}%0AUnit: ${v['Unit']}`;
    return `<tr>
      <td>${v['Variant Code']}</td>
      <td>${v['Description']}</td>
      <td>${v['Price/Unit']}</td>
      <td>${v['Unit']}</td>
      <td>${v['MOQ']}</td>
      <td><a href="https://wa.me/91xxxxxxxxxx?text=${msg}" target="_blank">WhatsApp</a></td>
    </tr>`;
  }).join('');

  detailDiv.innerHTML = `
    <button onclick="backToProducts('${data.category}')">Back</button>
    <h2>${data.name}</h2>
    <img src="${data.image}" alt="${data.name}" />
    <p>${data.specs}</p>
    <table>
      <tr>
        <th>Variant Code</th>
        <th>Description</th>
        <th>Price/Unit</th>
        <th>Unit</th>
        <th>MOQ</th>
        <th>Action</th>
      </tr>
      ${variantsRows}
    </table>
  `;
}

function backToProducts(category) {
  document.getElementById('product-detail').classList.add('hidden');
  showProducts(category);
}
// Handle Inquiry Form Submission
document.getElementById('inquiry-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const mobile = document.getElementById('mobile').value;
  const message = document.getElementById('message').value;

  fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, mobile, message })
  })
  .then(response => response.json())
  .then(data => {
    if (data.result === "success") {
      document.getElementById('form-status').innerText = "Inquiry submitted successfully!";
      document.getElementById('inquiry-form').reset();
    } else {
      document.getElementById('form-status').innerText = "Something went wrong. Try again.";
    }
  })
  .catch(() => {
    document.getElementById('form-status').innerText = "Network error. Try again.";
  });
});

<!-- Showcase / Rotating Slider -->
<section id="showcase" class="showcase">
  <div class="slider">
    <div class="slides" id="slider-images"></div>
  </div>
</section>

// === Build Slider Images ===
function buildSlider(data) {
  const sliderContainer = document.getElementById('slider-images');
  sliderContainer.innerHTML = '';

  const uniqueItems = {};
  data.forEach(row => {
    const itemCode = row['Item Code'];
    if (!uniqueItems[itemCode] && row['Image URL']) {
      uniqueItems[itemCode] = row['Image URL'];
    }
  });

  // Create slide elements for each unique image
  Object.values(uniqueItems).forEach((imageURL, index) => {
    const img = document.createElement('img');
    img.src = imageURL;
    img.className = 'slide' + (index === 0 ? ' active' : '');
    sliderContainer.appendChild(img);
  });

  // Start rotation if there are slides
  const slides = document.querySelectorAll('#slider-images .slide');
  if (slides.length > 1) {
    let currentSlide = 0;
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 3000);
  }
}

Papa.parse(PRODUCTS_CSV, {
  download: true,
  header: true,
  complete: function(results) {
    const data = results.data.filter(row => row['Item Code']); 
    buildCategories(data);
    buildSlider(data); // <-- add this line
  }
});

