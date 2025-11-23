import {LezioneResponseDto} from "../DTO/LezioneResponseDto";
import {Observable} from "rxjs";
import {LezioneRequestDto} from "../DTO/LezioneRequestDto";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {API_PATHS} from "../Constants/ApiPaths";

@Injectable({ providedIn: 'root' })
export class LezioniService {

  private readonly BASE = API_PATHS.LEZIONI;

  constructor(private http: HttpClient) {}

  getLezioniSettimana(data: string): Observable<LezioneResponseDto[]> {
    const params = new HttpParams().set('data', data);
    return this.http.get<LezioneResponseDto[]>(`${this.BASE}/settimana`, { params });
  }

  creaLezione(body: LezioneRequestDto): Observable<LezioneResponseDto> {
    return this.http.post<LezioneResponseDto>(`${this.BASE}`, body);
  }

  modificaLezione(id: string, body: LezioneRequestDto): Observable<LezioneResponseDto> {
    return this.http.put<LezioneResponseDto>(`${this.BASE}/modifica`, body);
  }

  annullaLezione(body: LezioneRequestDto): Observable<LezioneResponseDto> {
    return this.http.put<LezioneResponseDto>(`${this.BASE}/annulla`, body);
  }


}
