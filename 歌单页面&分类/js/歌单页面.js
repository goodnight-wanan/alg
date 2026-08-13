
function show(){
    var btn=document.getElementById('btn')
    btn.onclick=function(){
        var uname=document.getElementById('uname')
        var singer=document.getElementById('singer')
        var time=document.getElementById('time')
        var file=document.getElementById('file')
        var tbd=document.getElementById('tbd')
        if(uname.value==''||singer.value==''||time.value==''){
            alert('请输入完整歌曲的信息！')
            return
        }

        var newtr=document.createElement('tr')
        tbd.appendChild(newtr)
        var td1=document.createElement('td')
        var td2=document.createElement('td')
        var td3=document.createElement('td')
        var td4=document.createElement('td')

        td1.innerHTML=uname.value;
        td2.innerHTML=singer.value;
        td3.innerHTML=time.value;
        // td4.innerHTML=file.value+"<a href='javascript:;'>删除</a>"
        td4.innerHTML=file.value;
        newtr.appendChild(td1)
        newtr.appendChild(td2)
        newtr.appendChild(td3)
        newtr.appendChild(td4)
        var as=document.querySelectorAll('a')
        for(var i=0;i<as.length;i++){
            as[i].onclick=function(){
                tbd.removeChild(this.parentNode.parentNode)
            }
        }
    }
}
 