(function($){
    // Global Models
    // to-do: compair request times to use current data as cache
    var Global = {
        posts: [],
        users: [],
        loadPosts: function(){
            // force use local is exists because API dont updates
            if(this.posts.length){
                var self = this;
                return new Promise(function(resolve, resject){
                    resolve(self.posts);
                })
            }else{
                var self = this;
                return fetch('https://jsonplaceholder.typicode.com/posts')
                    .then(function(response){ return response.json()})
                    .then(function(json){
                        Global.posts = json;
                    });
            }
        },
        addPost: function(data){
            var self = this;

            return fetch('https://jsonplaceholder.typicode.com/posts', {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                })
                .then(function(response){ return response.json(); })
                .then(function(json){ 
                    self.posts.push(json);
                    console.log(json);
                    return json;
                })
        },
        loadComments: function(postId){
            var self = this;
            var url = postId ? 'https://jsonplaceholder.typicode.com/posts/' + postId + '/comments' : 'https://jsonplaceholder.typicode.com/comments' ;
            return fetch(url)
                .then(function(response){ return response.json()})
                .then(function(json){
                    Global.comments = json;
                });
        },
        addComment: function(data){
            return fetch('https://jsonplaceholder.typicode.com/comments', {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                })
                .then(function(response){ return response.json(); })
                .then(function(json){ console.log(json); return json; })
        },
        loadUsers: function(){
            var self = this;
            return fetch('https://jsonplaceholder.typicode.com/users')
                .then(function(response){ return response.json()})
                .then(function(json){
                    var users = [];
                    for (var index = 0; index < json.length; index++) {
                        var user = json[index];
                        users[user.id] = user;
                    }
                    Global.users = users;
                });
        }
    }

    // UI Components
    var Nav = {
        $el:null,
        $nav: null,
        init: function( selectorPages, selectorNav ){
            this.$el  = $(selectorPages);
            this.$nav = $(selectorNav);
            this.addEvents();
        },
        current: 'list',
        addEvents: function(){
            var self = this;
            this.$nav.find('a').click(function(){
                var target = $(this).attr("href");
                var component = eval( $(this).data("component") );

                if( component && component.reset ) component.reset();
                if( component && component.update ) component.update();

                self.goTo( target );
                console.log('Go to page ' + target);
                return false;
            });
        },
        goTo: function(page){
            // change Page
            this.$el.find('section').addClass('hide');
            this.$el.find(page).removeClass('hide');
            // update Nav
            this.$nav.find("a").removeClass('active');
            this.$nav.find("a[href='"+page+"']").addClass('active');
        }
    }

    var PostsList = {
        $el:null,
        $table: null,
        $newLine: null,
        init: function( selectorSection ){
            this.$el  = $(selectorSection);
            this.$table = this.$el.find('tbody');
            this.$newLine = this.$el.find('tbody tr');
            this.$newLine.detach();

            this.addEvents();
            this.update();
        },
        addEvents: function(){
            this.$el.find('a[href="#newpost"]').click(function(){
                var target = $(this).attr("href");
                Nav.goTo( target );
                return false;
            });
            this.$el.on('click', 'a[href="#newcomment"]', function(){
                var target = $(this).attr("href");
                var postId = $(this).data('postId');
                CommentForm.update(postId);
                Nav.goTo( target );
                return false;
            });
            this.$el.on('click', 'a[href="#listcomments"]', function(){
                var target = $(this).attr("href");
                var postId = $(this).data('postId');
                CommentsList.update(postId);
                Nav.goTo( target );
            })
        },
        renderTable: function(posts){
            posts = posts || Global.posts;
            this.$table.empty();

            for (var i = 0; i < posts.length; i++) {
                var post = posts[i];
                var user = Global.users[ post.userId ] || { name: 'unknown' };
                var $line = this.$newLine.clone();
                $line.find('td').eq(0).html(post.id);
                $line.find('td').eq(1).html(post.title);
                $line.find('td').eq(2).html(user.name);
                $line.find('a').data('postId', post.id);

                this.$table.append($line);
            }
        },
        update: function(){
            var self = this;

            this.$el.addClass('loading');
            this.$table.empty();
            Promise.all([Global.loadUsers(), Global.loadPosts()]).then(function(values) {
                self.renderTable();
                self.$el.removeClass('loading');
            });
        }
    }

    var CommentsList = {
        $el:null,
        $table: null,
        $newLine: null,
        init: function( selectorSection ){
            this.$el  = $(selectorSection);
            this.$table = this.$el.find('tbody');
            this.$newLine = this.$el.find('tbody tr');
            this.$newLine.detach();
            this.currentPostId = undefined;

            this.addEvents();
            this.update();
        },
        addEvents: function(){
            var self = this;
            this.$el.on('click', 'a[href="#newcomment"]', function(){
                var target = $(this).attr("href");
                CommentForm.update( self.currentPostId );
                Nav.goTo( target );
                return false;
            });
        },
        renderTable: function(comments){
            comments = comments || Global.comments;
            this.$table.empty();

            for (var i = 0; i < comments.length; i++) {
                var comment = comments[i];
                var $line = this.$newLine.clone();
                $line.find('td').eq(0).html(comment.id);
                $line.find('td').eq(1).html(comment.postId);
                $line.find('td').eq(2).html(comment.name);
                $line.find('td').eq(3).html(comment.email);
                $line.find('a').data('postId', comment.id);

                this.$table.append($line);
            }
        },
        update: function(postId){
            this.currentPostId = postId;
            var self = this;

            this.$el.addClass('loading');
            this.$table.empty();
            Promise.all([Global.loadUsers(), Global.loadComments(postId)]).then(function(values) {
                self.renderTable();
                self.$el.removeClass('loading');
            });
        }
    }

    var PostForm = {
        $el:null,
        init: function( selectorSection ){
            this.$el   = $(selectorSection);
            this.$form = this.$el.find('form');

            this.addEvents();
            this.update();
        },
        addEvents: function(){
            var self = this;
            this.$form.submit(function(){
                self.submit();
                return false;
            });
        },
        update: function(){
            var $userSelect = this.$form.find('[name="author"]');
            Global.loadUsers().then(function(){
                $userSelect.find('[value]').remove();
                var users = Global.users;
                for (var i = 0; i < users.length; i++) {
                    var user = users[i];
                    if( user ){
                        $userSelect.append("<option value='" + user.id + "'>" + user.name + "</option>");
                    }
                }
            });
        },
        reset: function(){
            this.$el.find('.feedback').html('');
            this.$form.find('[name]').val('');
        },
        validate: function( data, user ){
            var erros = []; 
            if( !data.title ) erros.push('PostId is obligatory');
            if( !data.userId ) erros.push('Author is obligatory');
            if( !data.body ) erros.push('Content is obligatory');

            if( erros.length ){
                erros.unshift('<strong>Please, verify the form:</strong>');
                this.$el.find('.feedback').html( erros.join('<br>') );
            }

            return erros.length;
        },
        submit: function(){
            var data = {
                title: this.$form.find('[name="title"]').val(),
                body: this.$form.find('[name="content"]').val(),
                userId: this.$form.find('[name="author"]').val()
            };
            var self = this;

            var erros = this.validate( data );

            if( erros === 0 ){
                Global.addPost(data).then(function(){
                    PostsList.update();
                    Nav.goTo('#list');
                    self.reset();
                });
            }
        }
    }

    var CommentForm = {
        $el:null,
        init: function( selectorSection ){
            this.$el   = $(selectorSection);
            this.$form = this.$el.find('form');
            this.currentPostId = undefined;

            this.addEvents();
            this.update();
        },
        addEvents: function(){
            var self = this;
            this.$form.submit(function(){
                self.submit();
                return false;
            });
        },
        update: function( postId ){
            this.currentPostId = postId;

            var $userSelect = this.$form.find('[name="author"]');
            Global.loadUsers().then(function(){
                $userSelect.find('[value]').remove();
                var users = Global.users;
                for (var i = 0; i < users.length; i++) {
                    var user = users[i];
                    if( user ){
                        $userSelect.append("<option value='" + user.id + "'>" + user.name + "</option>");
                    }
                }
            });

            this.$form.find('[name="post"]').val(postId);
        },
        reset: function(){
            this.$el.find('.feedback').html('');
            this.$form.find('[name]').val('');
        },
        validate: function( data, user ){
            var erros = []; 
            if( !data.postId ) erros.push('PostId is obligatory');
            if( data.postId && !Global.posts[data.postId] ) erros.push('Invalid PostId');
            if( !user ) erros.push('Author is obligatory');
            if( !data.body ) erros.push('Content is obligatory');
            if( user && !user.name ) erros.push('Invalid author. Please select another.');

            if( erros.length ){
                erros.unshift('<strong>Please, verify the form:</strong>');
                this.$el.find('.feedback').html( erros.join('<br>') );
            }

            return erros.length;
        },
        submit: function(){
            var userId = this.$form.find('[name="author"]').val();
            var user = Global.users[userId] || { name: '', email: '' } ;

            var data = {
                postId: this.$form.find('[name="post"]').val(),
                body: this.$form.find('[name="content"]').val(),
                name: user.name,
                email: user.email
            };
            var self = this;

            var erros = this.validate( data, user );

            if( erros === 0 ){
                Global.addComment(data).then(function(){
                    CommentsList.update();
                    Nav.goTo('#list');
                    self.reset();
                });
            }
        }
    }

    // START APP
    $(function(){
        Nav.init('main', 'nav');
        PostsList.init('#list');
        CommentsList.init('#listcomments');
        PostForm.init('#newpost');
        CommentForm.init('#newcomment');
    });
})(jQuery)