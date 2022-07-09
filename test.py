#import sklearn library
import sys
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

dataset={
        'Rahul': {'Special Ops': 5,
                  'Criminal Justice': 3,
                  'Panchayat': 3,
                  'Sacred Games': 3,
                  'Apharan': 2,
                  'Mirzapur': 3},
    
        'Rishabh': {'Special Ops': 5,
                    'Criminal Justice': 3,
                    'Sacred Games': 5,
                    'Panchayat':5,
                    'Mirzapur': 3,
                    'Apharan': 3},
    
        'Sonali': {'Special Ops': 2,
                   'Panchayat': 5,
                   'Sacred Games': 3,
                   'Mirzapur': 4},
    
        'Ritvik': {'Panchayat': 5,
                   'Mirzapur': 4,
                   'Sacred Games': 4,},
    
       'Harshita': {'Special Ops': 4,
                    'Criminal Justice': 4,
                    'Panchayat': 4,
                    'Mirzapur': 3,
                    'Apharan': 2},
    
       'Shubhi': {'Special Ops': 3,
                  'Panchayat': 4,
                  'Mirzapur': 3,
                  'Sacred Games': 5,
                  'Apharan': 3},
    
      'Shaurya': {'Panchayat':4,
                  'Apharan':1,
                  'Sacred Games':4}}


dataset_df=pd.DataFrame(dataset)
dataset_df.fillna("Not Seen Yet",inplace=True)
dataset_df

def unique_items():
    unique_items_list = []
    for person in dataset.keys():
        for items in dataset[person]:
            unique_items_list.append(items)
    s=set(unique_items_list)
    unique_items_list=list(s)
    return unique_items_list

unique_items()

def item_similarity(item1,item2):
    both_rated = {}
    for person in dataset.keys():
        if item1 in dataset[person] and item2 in dataset[person]:
            both_rated[person] = [dataset[person][item1],dataset[person][item2]]

    #print(both_rated)
    number_of_ratings = len(both_rated)
    if number_of_ratings == 0:
        return 0

    item1_ratings = [[dataset[k][item1] for k,v in both_rated.items() if item1 in dataset[k] and item2 in dataset[k]]]
    item2_ratings = [[dataset[k][item2] for k, v in both_rated.items() if item1 in dataset[k] and item2 in dataset[k]]]
    cs = cosine_similarity(item1_ratings,item2_ratings)
    return cs[0][0]



def most_similar_items(target_item):
    un_lst=unique_items()
    scores = [(item_similarity(target_item,other_item),target_item+" --> "+other_item) for other_item in un_lst if other_item!=target_item]
    scores.sort(reverse=True)
    return scores


#custom function to filter the seen movies and unseen movies of the target user

def target_movies_to_users(target_person):
    target_person_movie_lst = []
    unique_list =unique_items()
    for movies in dataset[target_person]:
        target_person_movie_lst.append(movies)

    s=set(unique_list)
    recommended_movies=list(s.difference(target_person_movie_lst))
    a = len(recommended_movies)
    if a == 0:
        return 0
    return recommended_movies,target_person_movie_lst


unseen_movies,seen_movies=target_movies_to_users('Ritvik')

dct = {"Unseen Movies":unseen_movies,"Seen Movies":seen_movies}
pd.DataFrame(dct)

def recommendation_phase(target_person):
    if target_movies_to_users(target_person=target_person) == 0:
        print(target_person, "has seen all the movies")
        return -1
    not_seen_movies,seen_movies=target_movies_to_users(target_person=target_person)
    seen_ratings = [[dataset[target_person][movies],movies] for movies in dataset[target_person]]
    weighted_avg,weighted_sim = 0,0
    rankings =[]
    for i in not_seen_movies:
        for rate,movie in seen_ratings:
            item_sim=item_similarity(i,movie)
            weighted_avg +=(item_sim*rate)
            weighted_sim +=item_sim
        weighted_rank=weighted_avg/weighted_sim
        rankings.append([weighted_rank,i])

    rankings.sort(reverse=True)
    return rankings
# print("Enter the target person")
tp = sys.argv[1]
if tp in dataset.keys():
    a=recommendation_phase(tp)
    if a != -1:
        for w,m in a:
            print(m)
else:
    print("Person not found in the dataset..please try again")
