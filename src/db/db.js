const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://admin:royalflush@cluster0-5sv3s.mongodb.net/test?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})

mongoose.set('useFindAndModify', false);