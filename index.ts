import express from "express";
import { MongoClient, ServerApiVersion, ObjectId, type MongoClientOptions } from "mongodb";
import { configDotenv } from "dotenv";
import type { IBook, IPageOptions } from "./types";
import { faker } from "@faker-js/faker";

configDotenv();

if (!process.env.MONGO_CONNECTION_URL || !process.env.DB_NAME) {
    throw new Error("Please set the appropriate DB environment variables.")
}

const DB_CLIENT = new MongoClient(process.env.MONGO_CONNECTION_URL, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

class BookService {
    private client;
    private dbName;

    constructor(clientInstance: MongoClient, dbName?: string) {
        this.client = clientInstance;
        this.dbName = dbName ?? "books";
    }

    private async col() {
        const dbInstance = (await this.client.connect()).db(this.dbName);
        return dbInstance.collection(this.dbName);
    }

    async getBooks() {
        const col = await this.col();
        const allBooks = await col.find().toArray();
        return allBooks ?? [];
    }

    async getBook(id: string) {
        const col = await this.col();
        const specificBook = await col.findOne({
            _id: new ObjectId(id)
        });
        if (!specificBook) {
            throw new Error("404", {
                cause: "Resource not found."
            });
        }
        return specificBook;
    }

    async createBook(book: IBook) {
        const col = await this.col();

        const { title, author, publisher, date, website } = book;
        if (!title || !author || !publisher || !date || !website) {
            throw new Error("422", {
                cause: "Data submitted does not have the right schema."
            });
        }

        const inserted = await col.insertOne({
            title,
            author,
            publisher,
            date,
            website
        });
        if (!inserted) {
            throw new Error("500", {
                cause: "There is an error inserting the data."
            });
        };
        return {
            id: inserted.insertedId.toString()
        };
    }

    async deleteBook(id: string) {
        const col = await this.col();

        const specificBook = await col.findOneAndDelete({
            _id: new ObjectId(id)
        });
        if (!specificBook) {
            throw new Error("404", {
                cause: "Resource not found."
            });
        }
    }
}

const BOOK_SERVICE = new BookService(DB_CLIENT, process.env.DB_NAME);

app.get('/', async (req, res) => {
    try {
        const books = await BOOK_SERVICE.getBooks();
    
        res.send(buildPage(/*html*/`
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h1>List of Books</h1>
                <a class="btn btn-primary" href="/create">Add new book</a>
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
                        ${books.map((book, i) => /*html*/`
                            <tr>
                                <th scope="row">${book._id}</th>
                                <td>${book.title}</td>
                                <td>${book.author}</td>
                                <td>${book.publisher}</td>
                                <td>${book.date}</td>
                                <td>${book.website}</td>
                                <td>
                                    <form id="delete-${book._id}" action="/delete" method="POST">
                                        <input type="hidden" name="id" value="${book._id}">
                                    </form>
                                    <button type="submit" form="delete-${book._id}" class="btn btn-danger btn-sm">Delete</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `));
    } catch (err) {
        handleError(res, err);
    }
});


app.get('/create', (req, res) => {
    const defaultData = {
        title: "",
        author: "",
        publisher: "",
        date: "",
        website: ""
    };

    if ("random" in req.query) {
        defaultData.title = faker.book.title();
        defaultData.author = faker.book.author();
        defaultData.publisher = faker.book.publisher();
        defaultData.date = faker.date.anytime().toISOString().split('T')[0] ?? "2020-02-20";
        defaultData.website = faker.internet.url();
    }

    res.send(buildPage(/*html*/`
        <form action="/create" method="POST">
            <div class="row g-3">
                <div class="col-12 d-flex justify-content-between align-items-center">
                    <h1>Add a New Book</h1>
                    <a class="btn btn-primary" href="/create?random">Random Data</a>
                </div>
                <div class="col-12">
                    <label for="title" class="form-label">Title</label>
                    <input type="text" class="form-control" id="title" name="title" value="${defaultData.title}">
                </div>
                <div class="col-12 col-md-4">
                    <label for="author" class="form-label">Author</label>
                    <input type="text" class="form-control" id="author" name="author" value="${defaultData.author}">
                </div>
                <div class="col-12 col-md-4">
                    <label for="publisher" class="form-label">Publisher</label>
                    <input type="text" class="form-control" id="publisher" name="publisher" value="${defaultData.publisher}">
                </div>
                <div class="col-12 col-md-4">
                    <label for="date" class="form-label">Date (YYYY-MM-DD)</label>
                    <input type="date" class="form-control" id="date" name="date" value="${defaultData.date}">
                </div>
                <div class="col-12">
                    <label for="website" class="form-label">Website</label>
                    <input type="text" class="form-control" id="website" name="website" value="${defaultData.website}">
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary">Submit</button>
                </div>
            </div>
        </form>
    `));
});

app.post('/create', async (req, res) => {

    const { title, author, publisher, date, website } = req.body;
    try {
        const newId = await BOOK_SERVICE.createBook({
            title,
            author,
            publisher,
            date,
            website
        });

        res.send(buildPage(/*html*/`
            <h1 class="mb-2">Submission Complete</h1>
            <p class="mb-3">The following book has been added! To view the list of books, click <a href="/">here</a></p>
    
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
                            <th scope="row">${newId.id}</th>
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
    } catch (err) {
        handleError(res, err);
    }
});

app.post('/delete', async (req, res) => {
    const idToDelete = req.body.id;
    try {
        await BOOK_SERVICE.deleteBook(idToDelete);
        res.redirect("/");
    } catch (err) {
        handleError(res, err);
    }
});

app.get('/error', (req, res) => {
    let content = "There seems to be an error trying to complete the action. Please try again later."

    if (req.query.message) {
        content = req.query.message.toString();
    }

    if (req.query.status) {
        content += ` (err: ${req.query.status})`;
    }

    res.send(buildPage(/*html*/`
        <div class="card">
            <h1 class="card-header h5">Ooops... Something went wrong...</h1>
            <div class="card-body">
                <p class="card-text">${content}</p>
                <a href="javascript:history.go(-1)" class="btn btn-sm btn-outline-primary">Return back</a>
            </div>
        </div>
    `));
})


const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
    console.log(`Now listening at http://localhost:${PORT}`);
});

function buildPage(htmlContent: string, options: Partial<IPageOptions> = {}) {
    const op: IPageOptions = {
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
                            <p class="navbar-brand mb-0 h1">Assignment 08</p>
                            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                                <li class="nav-item">
                                    <a class="nav-link" href="/">List of Books</a>
                                </li>
                            </ul>
                            <small class="navbar-brand mb-0 fs-6">Ignatius Nevan Defie: 501299336</small>
                        </div>
                    </header>
                    <main class="container mt-4">${htmlContent}</main>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-kenU1KFdBIe4zVF0s0G1M5b4hcpxyD9F7jL+jjXkk+Q2h455rYXK/7HAuoJl+0I4" crossorigin="anonymous"></script>
            </body>
        </html>
    `;
}

function handleError(res: any, err: unknown) {
    const data = {
        status: "",
        message: "",
    }

    if (err instanceof Error) {
        data.status = err.message;
        data.message = err.cause as string ?? "";
    }

    res.redirect(`/error?status=${data.status}&message=${data.message}`);
}