(function(){
	var view = function( obj ){

		this.pageCount = 3; //每页展示数量

		this.oMap = null //BMap对象

		this.DataSet = obj || null; //

		this.currentPage = 1; // 当前显示页码

		this.totalPage = $('#totalpage'); //一共多少页码

		this.isPaint = false; //是否开启描点模式

		this.prevPoly = ''; //上一次被查看的polygon

		this.singleDetail = document.getElementById('single-detail'); //form

		this.selfList = document.getElementById('self-list'); //列表

		this.deletePoint = document.getElementById('delete-point'); //删除上一坐标点

		this.deletePoints = document.getElementById('delete-points'); //删除坐标集

		this.oPolygon = {}; //内存保存polygon

		this.oMarker = {}; //内存保存Marker

		this.temporaryPolygon = {}; //临时的编辑区域

		this.mapclickhanler = null;

		this.selfIcon = new BMap.Icon('style/images/markers.png', new BMap.Size(19,25),{

			anchor: new BMap.Size( 10,25 ),

			imageOffset: new BMap.Size( -0, -(10*25) )
		}); //自定义icon图标

		this.mapConfig = {

			defaultCity: '重庆',

			defaultZoom: 9,

			defaultMapType: BMAP_NORMAL_MAP,

			defaultMapId: 'map-container',

			defaultPoints: new BMap.Point(106.524203,29.516936 ),

			maxZoom : 17,

			minZoom : 9
		};

		this.polygonOp ={ 

			strokeColor: 'red',    //边线颜色

			fillColor: 'yellow',  //填充颜色

			strokeWeight: 2,    //边线的宽度

			strokeOpacity: 0.7,  //边线透明度

			fillOpacity: 0.3,    //填充的透明度

			strokeStyle: 'solid'   //边线的样式
		};

		this.polygonHOp = {

			strokeColor: 'red',    //边线颜色

			fillColor: 'yellow',  //填充颜色

			strokeWeight: 3,    //边线的宽度

			strokeOpacity: 0.7,  //边线透明度

			fillOpacity: 0.5,    //填充的透明度

			strokeStyle: 'solid'   //边线的样式
		}
	};
	view.prototype = {

		loadData:function(originData,index){

			var that = this,

				index = index || 0,

				dataCon = document.getElementById( 'datalist' ),

				tmpData = originData[index];

			$('.data-container').empty();

			$( dataCon ).tmpl( tmpData ).appendTo('.data-container');

		},
		saveEditData:function(){
			var that = this,
			savedata = document.getElementById('savedata'); //保存数据

			$(savedata).on('click', function(event) {
				var tmpdata  = that.temporaryPolygon['polygon'] 
				var curEditdom = that.temporaryPolygon['curEditdom'] ;
				curEditdom.attr('data-points',that.polygonToArray(tmpdata));
			});
		},
		backToList: function(){

			var that = this,

				returnList = document.getElementById('returnlist'); //返回

			$(returnList).on('click', function(event) {

				if(that.prevPoly) that.oMap.removeOverlay(that.prevPoly);

				if(that.temporaryPolygon['marker'])
					that.oMap.removeOverlay(that.temporaryPolygon['marker']);
				if(that.temporaryPolygon['polygon'])
					that.temporaryPolygon['polygon'].map(function(item,idx){
							that.oMap.removeOverlay(item);
						});

				that.oMap.reset();

				that.selfList.style.display = 'block';

				that.singleDetail.style.display = 'none';

				that.isPaint = false;
				



				$(that.deletePoint).unbind();
				$(that.deletePoints).unbind()
				that.oMap.removeEventListener('click', that.mapclickhanler )
				that.mapclickhanler = null


			});
		},
		selfHandle: function(obj,point,idx,ordata){ //dragend事件的处理处理程序

			if( point.nodeName.toLowerCase() == 'input' ) point.value = obj.point.lng + ',' + obj.point.lat;

			if( point.nodeName.toLowerCase() == 'textarea' ){

				ordata[idx].setPosition(new BMap.Point(obj.point.lng, obj.point.lat));

				point.value = View.prototype.polygonToArray(ordata);

			}

		},
		polygonToArray: function(obj){ //将Polygon类型转化为字符串,用“|”相隔

			var pointsArray = [],

				resultArray = '';

			if(obj){

				obj.map(function( elem,index) {
					
					pointsArray.push(elem.getPosition().lng + ',' + elem.getPosition().lat );

				})
			}

			resultArray = pointsArray.join('|');

			return resultArray;

		},
		paintPoint: function(obj,input,data){ //描点开始

			var that = obj;
			return that.mapClick.call(null, that, input, data);
		},
		mapClick: function(t,inp,da){  //地图点击事件

			var _that = t, //view对象
				_input = inp, //textarea
				_data = da; //临时的编辑区域
			if(!!!_that.mapclickhanler ){
				_that.mapclickhanler = function(event){

					if(_that.isPaint){

						var oMarker = new BMap.Marker( new BMap.Point( event.point.lng, event.point.lat ));

						var selfLabel = new BMap.Label( _data.length );

						selfLabel.setStyle( { display:'block', position:'absolute', padding: '5px', color: '#fff', backgroundColor:'transparent', border:'none',fontSize:'12px' } );

						if(_data.length >= 10) selfLabel.setOffset( new BMap.Size( -3,-1 ) );

						oMarker.setLabel(selfLabel);
						
						_that.oMap.addOverlay(oMarker);
						_data.push(oMarker);
						_input.value = _that.polygonToArray(_data);

						oMarker.enableDragging();
						_that.selfDragend( oMarker, _input, _data.length - 1, _data );
					}

				};

			_that.oMap.addEventListener('click', _that.mapclickhanler )
			}

		},
		checkMap: function(){

			var that = this,

				landId = document.getElementById('landid'), //记录ID

				landNum = document.getElementById('landnum'), //土地编号

				landTitle = document.getElementById('landtitle'), //地理位置

				landPoint  = document.getElementById('landpoint'), //中心点坐标

				landPoints = document.getElementById('landpoints'); //坐标集

			$('body').on('click', '.maplook', function(event) {

				var dataCon = $(this).parent('div'),

                    tmpPoint = dataCon.attr('data-point'),

					tmpPoints = dataCon.attr('data-points'),

					tmpId = dataCon.attr('data-id'),

					tmpTitle = dataCon.attr('data-title'),

					tmpUrl = dataCon.attr('data-url');

				landId.value = tmpId;

				landNum.value = tmpUrl;

				landTitle.value = tmpTitle; 

				landPoint.value = tmpPoint;

				landPoints.value = tmpPoints;

				that.selfList.style.display = 'none';
			
				that.singleDetail.style.display = 'block';

				if(!tmpPoints){

					if(!tmpPoint) return;

					that.oMap.setCenter( new BMap.Point(tmpPoint.split(',')[0], tmpPoint.split(',')[1]) );

				}else{

					var tmpPos = that._pointsToOverlay( tmpPoints ),

						pen = new BMap.Polygon( tmpPos, that.polygonHOp );

						if( that.prevPoly ) that.oMap.removeOverlay( that.prevPoly );

						that.oMap.setCenter( that.oMap.getViewport(pen.getPath()).center );

						that.oMap.addOverlay( pen );

						that.prevPoly = pen;

				}	
			});
		},
		editMap: function(){

			var that = this,

				landId = document.getElementById('landid'), //记录ID

				landNum = document.getElementById('landnum'), //土地编号

				landTitle = document.getElementById('landtitle'), //地理位置

				landPoint  = document.getElementById('landpoint'), //中心点坐标

				landPoints = document.getElementById('landpoints'); //坐标集
			
			$('body').on('click', '.mapedit', function(event) {

				var dataCon = $(this).parent('div'),

                    tmpPoint = dataCon.attr('data-point'),

					tmpPoints = dataCon.attr('data-points'),

					tmpId = dataCon.attr('data-id'),

					tmpTitle = dataCon.attr('data-title'),

					tmpUrl = dataCon.attr('data-url'),

					markerIndex = 1;//坐标集开始坐标index

				that.isPaint = true;

				that.temporaryPolygon['curEditdom'] = dataCon;
				that.temporaryPolygon['marker'] = '';

				that.temporaryPolygon['polygon'] = [];

				landId.value = tmpId;

				landNum.value = tmpUrl;

				landTitle.value = tmpTitle; 

				landPoint.value = tmpPoint;

				landPoints.value = tmpPoints;

				that.selfList.style.display = 'none';
			
				that.singleDetail.style.display = 'block';

				if(tmpPoint){

					that.oMap.setCenter( new BMap.Point(tmpPoint.split(',')[0], tmpPoint.split(',')[1]) );

					that.oMap.removeOverlay(that.oMarker[tmpId]); //删除原marker,增加到编辑区临时的marker

					var tmpPo = that._pointToOverlay(tmpPoint); 

						mPen = new BMap.Marker(tmpPo,{icon:that.selfIcon}); //创建编辑时的marker 

					that.oMap.addOverlay(mPen);

					that.temporaryPolygon['marker'] = mPen;

					mPen.enableDragging();

					that.selfDragend(mPen,landPoint);
				}

				if(tmpPoints){

					var tmpPos = that._pointsToOverlay( tmpPoints ),

						pen = new BMap.Polygon( tmpPos, that.polygonHOp ),

						oldPlo = that.oPolygon[tmpId];

					that.oMap.removeOverlay(oldPlo);

					tmpPos.map(function( elem,index) {

						var oMarker = new BMap.Marker(elem);

						var selfLabel = new BMap.Label( index );

						selfLabel.setStyle( { display:'block', position:'absolute', padding: '5px', color: '#fff', backgroundColor:'transparent', border:'none',fontSize:'12px' } );

						if(index >= 10) selfLabel.setOffset( new BMap.Size( -3,-1 ) );

						oMarker.setLabel(selfLabel);
						
						that.oMap.addOverlay(oMarker);

						oMarker.enableDragging();

						that.temporaryPolygon['polygon'].push(oMarker);

						that.selfDragend( oMarker, landPoints, index, that.temporaryPolygon['polygon'] );

					})



					that.paintPoint(that, landPoints, that.temporaryPolygon['polygon']);

					//清除上一个坐标点
					$(that.deletePoint).on('click', function(event) {
						
						var lastmarker = that.temporaryPolygon['polygon'].pop();
						if(lastmarker)
							that.oMap.removeOverlay(lastmarker);
						landPoints.value = that.polygonToArray(that.temporaryPolygon['polygon']);
						
						event.preventDefault();
					});
					//清除坐标集
					$(that.deletePoints).on('click', function(event) {
						
						that.temporaryPolygon['polygon'].map(function(item,idx){
							that.oMap.removeOverlay(item);
						});

						that.temporaryPolygon['polygon'].length = 0
						landPoints.value = that.polygonToArray(that.temporaryPolygon['polygon']);
						event.preventDefault();
					});

				}

				event.preventDefault();
			});

		},
		selfDragend: function( params,par1,par2,par3){ //封装dragend的事件

			var that = this;

			params.addEventListener('dragend', function(obj){

				return that.selfHandle.call(null, obj, par1, par2, par3);
			});
		},
		mapFixed: function(params){

			var  that = this;

			if(!params) return;

			var fixedMap = document.getElementById('fixedmap');

			$(fixedMap).on('click', function(event) {

				if(!that.isPaint){
					that.isPaint = true; //描点模式开启

					params.disableScrollWheelZoom();

					params.disableDoubleClickZoom();

					params.disableKeyboard();

					params.disableDragging();
					$(fixedMap).text('解除固定')

				}else{
					that.isPaint = false; //关闭描点模式

					params.enableDoubleClickZoom()

					params.enableDragging();

					params.enableKeyboard();

					params.enableScrollWheelZoom();
					$(fixedMap).text('固定地图')

				}
				event.preventDefault();
			});
		},
		pageList : function( obj ){

			var pageCount = this.pageCount,

				pageArray = [],

				x = 0;

			for( var i = 0, j; j = obj[ i ]; i++ ){

				if( i % pageCount == 0 ){

					pageArray[ x ] = [];

					x++;

				}

				pageArray[ x - 1 ].push( j );

			}

			this.totalPage.html(pageArray.length);

			return pageArray;
		},
		pageNext: function(params){

			var nextBtn = $('#mapnext'),
				that = this;

			nextBtn.on('click', function(event) {

				if(that.currentPage == that.totalPage.html()){

					nextBtn.addClass('disabled');

					return;
				}else{

					nextBtn.removeClass('disabled');

					$('#mapprev').removeClass('disabled');

					that.currentPage++;

					$('#current').html(that.currentPage);

					that.loadData(params,that.currentPage - 1);
				}
			});
		},
		pagePrev: function(params){

			var prevBtn =$('#mapprev'),
				that = this;
			prevBtn.on('click', function(event) {

				if(that.currentPage == 1){

					prevBtn.addClass('disabled');

					return;
				}else{
					prevBtn.removeClass('disabled');

					$('#mapnext').removeClass('disabled');

					that.currentPage--;

					$('#current').html(that.currentPage);

					that.loadData(params,that.currentPage - 1);
				}
			});
		},
		overlayPoly : function( obj, bool ){

			var that = this;

			if( obj ){

				var oLength = obj.length;

				for( var i = 0; i < oLength; i++ ){

					if( obj[i].points ){

						var oPoints = this._pointsToOverlay( obj[i].points ),

							pen  = new BMap.Polygon( oPoints, that.polygonOp );

						that.oMap.addOverlay( pen );
						
						that.oPolygon[obj[i].id] = pen;
					}
					if( obj[i].point ){

						var oPoint = this._pointToOverlay( obj[i].point ),

							mPen = new BMap.Marker( oPoint );

						that.oMap.addOverlay( mPen );

						that.oMarker[obj[i].id] = mPen;
					}
				}
				
			}else{
				
			}
		},
		overlayMarker: function( obj, boolean ){

			var that = this;

			if( obj ){

				var mPen = new BMap.Marker( new BMap.Point( obj ) );



			}
		},
		_pointsToOverlay: function( obj ){
			var pointArray     =   [],
				points         =   obj.split( '|' ),
				pointsLength   =   points.length;

			for( var t = 0; t < pointsLength; t++ ){

				var str = points[t].split(',');

				pointArray.push( new BMap.Point( str[ 0 ], str[ 1 ] ) );

			}

			return pointArray;
		},
		_pointToOverlay: function( obj ){

			var	str = obj.split( ',' ),

			 	tmpPoint = new BMap.Point( str[ 0 ], str[ 1 ] );

			return tmpPoint;
		},
		deletepoint:function(){
			var  that = this;


		},
		deletepoints : function(){
			var  that = this;


		},
		initMap : function( obj ){

			var that = this,

				mapPrev = $('#mapprev'), //上一页

				mapNext = $('#mapnext'); //下一页

			that.oMap = new BMap.Map( that.mapConfig.defaultMapId );

			that.oMap.setMapType( that.mapConfig.defaultMapType );

			that.oMap.centerAndZoom( that.mapConfig.defaultPoints, that.mapConfig.defaultZoom );

			that.oMap.enableScrollWheelZoom();

			that.oMap.addControl( new BMap.NavigationControl() );

			that.oMap.enableKeyboard();

			//that.overlayPoly( obj, true );
			
			


			that.mapFixed( that.oMap );



			that.checkMap();

			that.editMap();

			that.backToList();
			that.saveEditData();
		}
	};
	window.View = view;
})()