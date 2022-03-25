import * as jquery from '/scripts/jquery.3.6.0.min.js'
import * as jquerycsv from '/scripts/jquery.csv.min.js'
import { Octokit } from 'https://cdn.skypack.dev/@octokit/core'

const gits_api_key = process.env.MY_GIST

const octokit = new Octokit({ auth: gits_api_key })

const gistId = '1d7a419ad16b4be712b14fc7be7aa6c7'
const gameId = 22699901
const defaultServerId = 1156
//const roleid = 9151513732
let roleId   = null
let account  = null
let cdkeyObj = null
let serverId = null
let gistFile = null



const getServerList = async () => {
	
	let res = await Promise.resolve($.post("https://activity.zloong.com/giftcard/getServerList.do", $.param({
		gameId: gameId
	})))
	
	if (res.retcode == 0) {
		let serverOptions = ""
		
		if (res.serverinfo) {
			
			res.serverinfo.map( item => {
				
				if (defaultServerId == item.serverid) {
					serverOptions +=
					`<option value=${item.serverid} selected="selected"> ${item.servername} </option>`
				}
				else {
					serverOptions +=
					`<option value=${item.serverid}> ${item.servername} </option>`
				}
			})
			$('.server').append(serverOptions)
		}
	}
}


const getDateMonthYear = timestamp => {
	let months = ['01','02','03','04','05','06','07','08','09','10','11','12']
	
	let date = timestamp.getDate() < 10 ? `0${timestamp.getDate()}` : `${timestamp.getDate()}`
	let month = months[timestamp.getMonth()]
	let year = `${timestamp.getFullYear()}`
	
	return `${date}/${month}/${year}`
	
}

const getCDKeyObj = async () => {
	let rawData =  await octokit.request('GET /gists/{gist_id}', {
		gist_id: gistId
	})
	
	gistFile = rawData.data.files
	
	return $.csv.toObjects(rawData.data.files.EpicWarThronesCDKey.content)

}

const appendCDkeyTable = (cdkeyObj) => {
	let cdkeyTable = ''
	cdkeyObj.forEach( item => {
		let timestamp = parseInt(item.time_added)
		cdkeyTable +=
		`
			<tr>
				<td>${item.code}</td>
				<td>${item.who_added}</td>
				<td>${getDateMonthYear( new Date(timestamp) )}</td>
			</tr>
		`
	})
	$('.cdkey-div table').append(cdkeyTable)
}


await getServerList()
cdkeyObj = await getCDKeyObj()
appendCDkeyTable(cdkeyObj)

// chỉ cho nhập số vào 'ID nhân vật'
window.addEventListener('input', e => {
	if (e.target.id == 'roleid') {
		event.target.value = event.target.value.replace(/[^-0-9.]/g, '')
	}
	else if (e.target.id == 'addcode') {
		if (e.target.value != "") {
			$('.addcode-btn').prop('disabled', false)
		}
		else {
			$('.addcode-btn').prop('disabled', true)
		}
	}
})

// xác nhận
$('.confirm-btn').click(async e => {
	
	roleId   = $('.role-id').val()
	serverId = $('.server').val()
	
	let res = await Promise.resolve($.post("https://activity.zloong.com/giftcard/getHTRoleInfo.do", $.param({
		gameId: gameId,
		serverid: serverId,
		roleid: roleId
	})))
	
	if (res.retcode == 0) {
		account = res.account + "$zulong"
		$('.role-name').val(decodeURI(res.rolename))
		$('.apply-btn').prop('disabled', false)
	}
	else {
		account = null
		$('.role-name').val("Không có người này")
		$('.apply-btn').prop('disabled', true)
	}
	
})

// nhập toàn bộ code
$('.apply-btn').click(async e => {
	
	console.log($('table tr')[1].children[0].innerText)
	
	$('.cdkey-div table tr').each(async (idx, row) => {
		
		if (row.id != 'table-header') {
			
			
			
			let res = await Promise.resolve($.post("https://activity.zloong.com/giftcard/useGiftCard.do", $.param({
				gameId: gameId,
				roleid: roleId,
				account: account,
				serverid: serverId,
				cardnum: row.children[0].innerText
			})))
			
			console.log(res)
			
			switch (res) {
				case 0: 
					row.setAttribute("class", "code0")
					break;
					
				// code không đúng
				case 402: 
					row.setAttribute("class", "code402")
					break;
					
				// code hêt lượt
				case 403: 
					row.setAttribute("class", "code403")
					break;
				
				// code đã dùng
				case 404: 
					row.setAttribute("class", "code404")
					break;
					
			}	
		}
	})
})

// thêm code
$('.addcode-btn').click(async e => {
	
	let code = $('#addcode').val()
	let who_added = $('#who-added').val() != "" ? $('#who-added').val() : "noname"
	let time_added = new Date().getTime()
	
	cdkeyObj.push({
		code: code,
		who_added: who_added,
		time_added: time_added
	})
	
	appendCDkeyTable(cdkeyObj)
	
	gistFile.EpicWarThronesCDKey.content = $.csv.fromObjects(cdkeyObj)
	
	
	await octokit.request('PATCH /gists/{gist_id}', {
	  gist_id: gistId,
	  description: 'EpicWarThronesCDKey',
	  files: gistFile
	})
})

// var result =  await octokit.request('GET /gists/{gist_id}', {
//   gist_id: gistId
// })
// 
// result.data.files.EpicWarThronesCDKey.content = "tran\nnhut\nquang"
// 
// await octokit.request('PATCH /gists/{gist_id}', {
//   gist_id: gistId,
//   description: 'EpicWarThronesCDKey',
//   files: result.data.files
// })
// 
// console.log(result.data.files.EpicWarThronesCDKey.content)
