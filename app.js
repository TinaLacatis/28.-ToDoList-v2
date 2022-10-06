const express = require("express");// require express
const https = require("https"); // require ejs
const mongoose = require('mongoose'); // require mongoose
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true}));
//create new database
mongoose.connect("mongodb+srv://admin-tina:test123@cluster0.9tch0ws.mongodb.net/todolistDB");
//create the new schema
const itemsSchema = mongoose.Schema({name: String});
//create the ITEM model based on the schema (ITEM- the singular version for the ITEMS collection that is goiung to be created)
const Item = mongoose.model("Item", itemsSchema);
//create 3 new documents
const item1 = new Item({name: "Welcome to your todolist!"});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to detele an item."});
// create a new array to save the default items of the ToDoList
const defaultItems = [item1, item2, item3];
//for every new list we create, the list is gonna have a name and an array of documents
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    // if there are no items into the collection, we insert the default items
    if (foundItems.length === 0) {
      //insert new documents (the array) into ITEMS collection
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved default items to todolistDB");
        }
      });
      res.redirect("/");
    } else {
      //otherwise we just render the list.ejs
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});
//new route for a new List that is created
app.get('/:customListName', function(req, res) {
  const customList = _.capitalize(req.params.customListName);

  List.findOne({name: customList}, function(err,foundList){
    if(!err){
      if(!foundList){
        //create new list
        const list = new List({
          name:customList,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customList);
      } else {
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });

});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  //create a new document that hase the name that the user writes it on the list.ejs
  const item = new Item({name: itemName});
  if (listName === "Today"){
    //insert the new document into the ITEMS collection
    item.save();
    //after we ave, we redirect to home and we render the item on the screen
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Succesfully deleted item from todolistDB");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res) {
  res.render("about");
});


app.listen(3000, function() { // we listen on port 3000
  console.log("Server started on port 3000."); // we console log that our server has been started
});
