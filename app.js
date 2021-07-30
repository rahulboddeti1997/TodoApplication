const { format } = require("date-fns");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasDateProperty = (requestQuery) => {
  return requestQuery.date !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

function checkValid1(request, response, next) {
  const { priority, status, category, date } = request.body;

  switch (true) {
    case hasPriorityProperty(request.body):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.body):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.body):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasDateProperty(request.body):
      if (new Date(date).getTime() === new Date(date).getTime()) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Due Date");
      }
      break;
    default:
      next();
      break;
  }
}

function checkValid(request, response, next) {
  const { priority, status, category, date } = request.query;

  switch (true) {
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasDateProperty(request.query):
      if (new Date(date).getTime() === new Date(date).getTime()) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Due Date");
      }
      break;
    default:
      next();
      break;
  }
}
app.get("/todos/", checkValid, async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", checkValid, async (request, response) => {
  const { todoId } = request.params;
  const Query = `
    SELECT 
    *
    FROM 
    todo
    WHERE
    id = ${todoId}`;
  const result = await database.get(Query);
  response.send(result);
});

app.get("/agenda/", checkValid, async (request, response) => {
  const { date } = request.query;
  const datList = date.split("-");
  const newDate = format(
    new Date(datList[0], datList[1] - 1, datList[2]),
    "yyyy-MM-dd"
  );

  const Query = `
    SELECT 
    *
    FROM 
    todo
    WHERE
    due_date = '${newDate}';`;

  const result = await database.all(Query);
  response.send(result);
});

app.post("/todos/", checkValid1, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const datList = dueDate.split("-");
  const newDate = format(
    new Date(datList[0], datList[1] - 1, datList[2]),
    "yyyy-MM-dd"
  );
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}','${category}','${newDate}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", checkValid1, async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category ='${category}',
      due_date = '${dueDate}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
