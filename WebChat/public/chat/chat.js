var socket = io();//传递给服务器用户Id
var chatSession = [];
var uid = $.cookie('id');
var fid;
var name;

$(init);

function init() {

    if($(window).width() <= 450) {
        $('[data-toggle="sidebar-on"]').on('click', function (e) {
            e.preventDefault();
            $('.mobile-sidebar').hide("fast");
            $('.chat-sidebar').show("fast");
        });

        $('[data-toggle="sidebar-off"]').on('click', function (e) {
            e.preventDefault();
            $('.chat-sidebar').hide("fast");
            $('.mobile-sidebar').show("fast");
        });
    }

    $('body').on('click', '.history-msg' , toggleHistoryView);
    $('body').on('click', '.history-back' , toggleChatView);

    $('[data-toggle="select"]').on('mouseover', function (e) {
        e.preventDefault();
        var $this = $(this);
        $this.find('.users-list-r').show();
    });

    $('[data-toggle="select"]').on('mouseout', function (e) {
        e.preventDefault();
        var $this = $(this);
        $this.find('.users-list-r').hide();
    });
    $('[data-toggle="select"]').on('click', function (e) {
        e.preventDefault();
        var $this = $(this);
        var friendId = $this.data('id');
        if(friendId == $.cookie('id')) {
            alert("不能添加自己！");
        } else {
            doAddFriend(friendId);
        }
    });
    $('[data-toggle="chat"]').on('click', function (e) {
        e.preventDefault();
        var $this = $(this);
        fid = $this.data('id');
        name = $this.children('.username').html();
        createChat();
        $(".chat-default").hide();
        $(".box-send").show();
    });

    $('form').submit(function(){
        var ctn = $('#m').val();
        if(ctn != '') {
            var html = $.format(TO_MSG, ctn);
            $("#m"+fid).append(html);
            var msg = {
                from: uid,
                to: fid,
                content: ctn
            };
            socket.emit('chat message', msg);
        }
        $('#m').val('');
        return false;
    });
    socket.on('chat message', function(data){
        if(data.status == 2) {
            var unread = parseInt($("#r"+data.from).html())+1;
            $("#r"+data.from).html(unread);
            $("#r"+data.from).show();
            doAddMsg(0, data.ctn, data.from, data.to);
        } else if(data.status == 1) {
            var html = $.format(FROM_MSG, data.msg);
            $("#m"+fid).append(html);
            doAddMsg(1, data.ctn, data.from, data.to);
        } else if(data.status == 0) {
            doAddMsg(0, data.ctn, data.from, data.to);
        }
    });
    socket.on('user left', function (msg) {
        var html = '<li class="chat-box-l"><img class="chat-user-img" src="/images/mb2.jpg"><p class="chat-p">' + msg +'</p></li>';
        $("#m"+fid).append(html);
    });
}

function createChat() {
    if (chatSession.indexOf(fid) === -1) {
        chatSession.push(fid);
    }
    var data = {
        from: uid,
        to: fid
    };
    socket.emit('add user', data);
    toggleChatView();
}

//切换聊天窗口
function toggleChatView() {
    if ($("#t"+fid).length == 0 && $("#c"+fid).length == 0) {
        $(".chat-area").prepend('<div class="box-hd" id="t'+fid+'"> <div class="info-friend">'+name+'</div><div class="history-msg">聊天记录</div></div><div class="box-bd" id="c'+fid+'"><ul class="messages" id="m'+fid+'"></ul></div>');
    }
    $(".box-bd").css("height", "528px");
    getUnreadMsg(fid);
    updateMsgStatus(fid);
    $(".box-hd").hide();
    $(".box-bd").hide();
    $(".box-send").show();
    $("#t"+fid).show();
    $("#c"+fid).show();
}

//切换聊天记录窗口
function toggleHistoryView() {
    $("#mh"+fid).html('');
    if ($("#th"+fid).length == 0 && $("#ch"+fid).length == 0) {
        $(".chat-area").prepend('<div class="box-hd" id="th'+fid+'"> <div class="info-friend">与'+name+'的聊天记录</div><div class="history-back">返回</div> </div><div class="box-bd" id="ch'+fid+'"><ul class="messages" id="mh'+fid+'"></ul></div>');
    }
    getHistoryMsg();
    $(".box-hd").hide();
    $(".box-bd").hide();
    $(".box-send").hide();
    $(".box-bd").css("height", "709px");
    $("#th"+fid).show();
    $("#ch"+fid).show();
}

function doAddFriend(friendId) {
    $.ajax({
        type: "POST",
        url: "/p/addFriend",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
            'user': $.cookie('id'),
            'friend': friendId
        }),
        success: function(result) {
            if (result.code == 99) {
                alert("添加出错");
            } else if(result.code == 98) {
                alert("该好友已添加！");
            } else{
                alert("添加成功！");
                location.href = '/p/index';
            }
        }
    })
}

function postData(url, data, cb) {
    var promise = $.ajax({
        type: "post",
        url: url,
        dataType: "json",
        contentType: "application/json",
        data:data
    });
    promise.done(cb);
}

function doAddMsg(status, ctn, from, to) {
    var jsonData = JSON.stringify({
        'from': from,
        'to': to,
        'content': ctn,
        'status': status
    });
    postData(urlAddMsg, jsonData, cbAddMsg);
}

function getUnreadMsg(fid) {
    var jsonData = JSON.stringify({
        'from': fid,
        'to': uid
    });
    postData(urlGetUnreadMsg, jsonData, cbShowMsg);
}

function updateMsgStatus(fid) {
    var jsonData = JSON.stringify({
        'from': fid,
        'to': uid
    });
    postData(urlUpdateMsgStatus, jsonData, cbSetOffMsgCount);
}

function getHistoryMsg() {
    var jsonData = JSON.stringify({
        'from': fid,
        'to': uid
    });
    postData(urlGetHistoryMsg, jsonData, cbShowHistoryMsg);
}

function cbShowMsg(result) {
    if(result.length != 0) {
        for(var i =0; i < result.length; i++) {
            var html = '<li class="chat-box-l"><img class="chat-user-img" src="/images/mb2.jpg"><p class="chat-p">' + result[i].content +'</p></li>';
            $("#m"+fid).append(html);
        }
    }
}
function cbSetOffMsgCount(result) {
    var id = result.id;
    $("#r"+id).html('0');
    $("#r"+id).hide();
}
function cbAddMsg(result) {
    var msg = result.code;
    if(msg == 99) {
        alert("消息保存失败!");
    }
}
function cbShowHistoryMsg(result) {
    if(result.length != 0) {
        for(var i =0; i < result.length; i++) {
            if(result[i].from == uid) {
                var html = $.format(TO_MSG, result[i].content);
            } else {
                var html = $.format(FROM_MSG, result[i].content);
            }
            $("#mh"+fid).append(html);
        }
    }
}