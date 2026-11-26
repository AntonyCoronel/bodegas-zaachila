import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página portada desde proyecto/contacto.html. */
@Component({
  selector: 'app-contacto',
  imports: [RouterLink],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class Contacto {}
