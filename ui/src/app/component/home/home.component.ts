import { Component, OnInit } from '@angular/core';

import { BaseComponent } from 'bundle/component';

import { AppService } from 'bundle/service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends BaseComponent implements OnInit {
	constructor(appService: AppService) {
		super(appService);
	}

	ngOnInit(): void {
		
	}
}