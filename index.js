import express, { Router } from "express";

/**
 * @type {IBook[]}
 */
const DB_BOOKS = [
    {
        title: "The Shadow's Whisper",
        author: "Eleanor Carter",
        publisher: "Nightfall Press",
        date: "2021-07-15",
        website: "https://nightfallpress.com/shadows-whisper"
    },
    {
        title: "Beyond the Stars",
        author: "Marcus Ellison",
        publisher: "Galactic Reads",
        date: "2019-05-22",
        website: "https://galacticreads.com/beyond-the-stars"
    },
    {
        title: "Echoes of the Past",
        author: "Samantha Green",
        publisher: "Heritage Publishing",
        date: "2023-02-10",
        website: "https://heritagepublishing.com/echoes-of-the-past"
    },
    {
        title: "Artificial Mind",
        author: "Jonathan Wells",
        publisher: "TechFuture Books",
        date: "2020-11-05",
        website: "https://techfuturebooks.com/artificial-mind"
    },
    {
        title: "The Last Kingdom",
        author: "Victoria Hayes",
        publisher: "Empire Stories",
        date: "2018-09-30",
        website: "https://empirestories.com/the-last-kingdom"
    },
    {
        title: "Ocean's Lament",
        author: "Daniel Roberts",
        publisher: "BlueWave Publishing",
        date: "2022-06-18",
        website: "https://bluewavepublishing.com/oceans-lament"
    },
    {
        title: "Mystic Chronicles",
        author: "Isabella Monroe",
        publisher: "Fantasy Realm",
        date: "2017-04-25",
        website: "https://fantasyrealm.com/mystic-chronicles"
    },
    {
        title: "Cybernetic Dawn",
        author: "Richard Thompson",
        publisher: "NeonTech Books",
        date: "2024-01-08",
        website: "https://neontechbooks.com/cybernetic-dawn"
    }
];

const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.get('/', (req, res) => {
    res.redirect("/bookinventory/list")
});

const booksRouter = Router();

booksRouter.get('/list', (req, res) => {
    res.send(buildPage(/*html*/`
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h1>List of Books</h1>
            <a class="btn btn-primary" href="/bookinventory/add">Add new book</a>
        </div>
        <div class="table-responsive">
            <table class="table table-bordered align-middle">
                <thead class="table-light">
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Title</th>
                        <th scope="col">Author</th>
                        <th scope="col">Publisher</th>
                        <th scope="col">Date</th>
                        <th scope="col">Website</th>
                        <th scope="col">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${DB_BOOKS.map((books, i) => /*html*/`
                        <tr>
                            <th scope="row">${i + 1}</th>
                            <td>${books.title}</td>
                            <td>${books.author}</td>
                            <td>${books.publisher}</td>
                            <td>${books.date}</td>
                            <td>${books.website}</td>
                            <td>
                                <form id="delete-${i}" action="/bookinventory/deletebook" method="POST">
                                    <input type="hidden" name="index" value="${i}">
                                </form>
                                <button type="submit" form="delete-${i}" class="btn btn-danger btn-sm">Delete</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `));
});


booksRouter.get('/add', (req, res) => {

    res.send(buildPage(/*html*/`
        <form action="/bookinventory/addbook" method="POST">
            <div class="row g-3">
                <div class="col-12">
                    <h1>Add a New Book</h1>
                </div>
                <div class="col-12">
                    <label for="title" class="form-label">Title</label>
                    <input type="text" class="form-control" id="title" name="title">
                </div>
                <div class="col-12 col-md-4">
                    <label for="author" class="form-label">Author</label>
                    <input type="text" class="form-control" id="author" name="author">
                </div>
                <div class="col-12 col-md-4">
                    <label for="publisher" class="form-label">Publisher</label>
                    <input type="text" class="form-control" id="publisher" name="publisher">
                </div>
                <div class="col-12 col-md-4">
                    <label for="date" class="form-label">Date (YYYY-MM-DD)</label>
                    <input type="text" class="form-control" id="date" name="date">
                </div>
                <div class="col-12">
                    <label for="website" class="form-label">Website</label>
                    <input type="text" class="form-control" id="website" name="website">
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary">Submit</button>
                </div>
            </div>
        </form>
    `));
});

booksRouter.post('/addbook', (req, res) => {

    const { title, author, publisher, date, website } = req.body;
    DB_BOOKS.push({
        title,
        author,
        publisher,
        date,
        website
    });

    res.send(buildPage(/*html*/`
        <h1 class="mb-2">Submission Complete</h1>
        <p class="mb-3">The following book has been added! To view the list of books, click <a href="/bookinventory/list">here</a></p>

        <div class="table-responsive">
            <table class="table table-bordered align-middle">
                <thead class="table-light">
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Title</th>
                        <th scope="col">Author</th>
                        <th scope="col">Publisher</th>
                        <th scope="col">Date</th>
                        <th scope="col">Website</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">1</th>
                        <td>${title}</td>
                        <td>${author}</td>
                        <td>${publisher}</td>
                        <td>${date}</td>
                        <td>${website}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `));
});

booksRouter.post('/deletebook', (req, res) => {
    const deleteIndex = parseInt(req.body.index);

    if ("index" in req.body && typeof deleteIndex === "number" && deleteIndex < DB_BOOKS.length) {
        DB_BOOKS.splice(deleteIndex, 1);
    }

    res.redirect("/bookinventory/list");
});

app.use("/bookinventory", booksRouter);

const listener = app.listen(3000, () => {
    console.log("Now listening at http://localhost:3000");
});

/**
 * @param {string} htmlContent 
 * @param {Partial<IPageOptions>} options
 */
function buildPage(htmlContent, options = {}) {
    /**
     * @type {IPageOptions}
     */
    const op = {
        title: "Page",
        lang: "en",
        ...options
    }

    return /*html*/`
        <html lang="${op.lang}">
            <head>
                <meta charset="UTF-8">
                <title>${op.title}</title>
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65" crossorigin="anonymous">
            </head>
            <body>
                <div id="app">
                    <header class="navbar bg-light">
                        <div class="container-fluid">
                            <p class="navbar-brand mb-0 h1">Assignment 07</p>
                            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                                <li class="nav-item">
                                    <a class="nav-link" href="/bookinventory/list">List of Books</a>
                                </li>
                            </ul>
                            <small class="navbar-brand mb-0 fs-6">Ignatius nevan Defie: 501299336</small>
                        </div>
                    </header>
                    <main class="container mt-4">${htmlContent}</main>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+jjXkk+Q2h455rYXK/7HAuoJl+0I4" crossorigin="anonymous"></script>
            </body>
        </html>
    `;
}